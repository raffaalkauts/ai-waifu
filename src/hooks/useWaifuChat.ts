import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, Character } from "../db/schema";
import db from "../db/schema";
import {
  loadConversation,
  createConversation,
  deleteConversation,
  saveMessage,
} from "../db";
import { chatWithWaifu } from "../api/openrouter";
import { trackTokenUsage } from "../utils/tokenTracking";
import {
  checkAndAutoSummarize,
  buildContextWithSummaries,
} from "../utils/summarization";

/* ── Types ──────────────────────────────────────────────── */

export type WaifuErrorType = "api" | "network" | "db" | "unknown" | null;

/* ── Helpers ────────────────────────────────────────────── */

function generateId(): string {
  return crypto.randomUUID();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const SUMMARIZE_THRESHOLD = 15;
const MAX_RETRIES = 3;

function classifyError(err: unknown): { type: WaifuErrorType; friendly: string } {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("401") || m.includes("api key") || m.includes("unauthorized")) {
      return { type: "api", friendly: "Invalid API key. Check your OpenRouter configuration." };
    }
    if (m.includes("402") || m.includes("insufficient") || m.includes("credits")) {
      return { type: "api", friendly: "Not enough credits. Add funds to your OpenRouter account." };
    }
    if (m.includes("429") || m.includes("rate limit")) {
      return { type: "api", friendly: "Too many requests. Please wait a moment and try again." };
    }
    if (m.includes("network") || m.includes("fetch") || m.includes("timeout") || m.includes("econnrefused")) {
      return { type: "network", friendly: "Network error. Check your internet connection." };
    }
    if (m.includes("dexie") || m.includes("indexeddb") || m.includes("database")) {
      return { type: "db", friendly: "Database error. Try clearing your browser data." };
    }
    if (m.includes("500") || m.includes("503") || m.includes("service")) {
      return { type: "api", friendly: "OpenRouter service is temporarily down. Try again later." };
    }
  }
  return { type: "unknown", friendly: "Something went wrong. Please try again." };
}

/* ── Hook ───────────────────────────────────────────────── */

export function useWaifuChat(
  characterId: string | null,
  character: Character | null,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<WaifuErrorType>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [optimized, setOptimized] = useState(false);

  const conversationRef = useRef<{
    id: string;
    totalMessages: number;
    summaries: { period: string; summary: string; createdAt: number; messageRange: [number, number] }[];
  } | null>(null);
  const loadingRef = useRef(false);
  const pendingMessageRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);

  /* ── Clear error ────────────────────────────────────────── */

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  /* ── Load existing conversation ─────────────────────────── */

  const loadChat = useCallback(async () => {
    if (!characterId || !character) return;

    try {
      clearError();

      const existing = await loadConversation(characterId);
      if (existing) {
        conversationRef.current = {
          id: existing.id,
          totalMessages: existing.totalMessages,
          summaries: existing.summaries,
        };
        setConversationId(existing.id);
        setMessages(existing.messages);
        setOptimized(existing.summaries.length > 0);
        console.log(
          `[waifu] Loaded conversation ${existing.id} ` +
            `(${existing.messages.length} messages, ` +
            `${existing.summaries.length} summaries)`,
        );
      } else {
        conversationRef.current = null;
        setConversationId(null);
        setMessages([]);
        setOptimized(false);
        console.log("[waifu] No existing conversation found");
      }
    } catch (err) {
      const { friendly } = classifyError(err);
      console.error("[waifu] Failed to load conversation:", err);
      setError(friendly);
      setErrorType("db");
    }
  }, [characterId, character, clearError]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  /* ── Ensure conversation exists ─────────────────────────── */

  async function ensureConversation(): Promise<string> {
    if (conversationRef.current) {
      return conversationRef.current.id;
    }

    if (!character) throw new Error("No character selected");

    try {
      const conv = await createConversation(characterId!, character.name);
      conversationRef.current = {
        id: conv.id,
        totalMessages: 0,
        summaries: [],
      };
      setConversationId(conv.id);
      console.log("[waifu] Created conversation", conv.id);
      return conv.id;
    } catch (err) {
      const { friendly } = classifyError(err);
      throw new Error(friendly);
    }
  }

  /* ── Estimate tokens in context ──────────────────────────── */

  function estimateContextTokens(
    summaries: { summary: string }[],
    recentMsgs: ChatMessage[],
    systemPrompt: string,
  ): number {
    let total = estimateTokens(systemPrompt);
    for (const s of summaries) total += estimateTokens(s.summary);
    for (const m of recentMsgs) total += estimateTokens(m.content);
    return total;
  }

  /* ── Send message (with retry) ───────────────────────────── */

  const sendMessage = useCallback(
    async (userMessage: string, retry = false) => {
      if (!userMessage.trim()) return;
      if (!characterId || !character) {
        setError("No character selected");
        setErrorType("unknown");
        return;
      }
      if (loadingRef.current && !retry) return;

      if (!retry) {
        retryCountRef.current = 0;
        pendingMessageRef.current = userMessage;
      }

      loadingRef.current = true;
      setLoading(true);
      if (!retry) clearError();

      let convId: string;

      try {
        convId = await ensureConversation();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create conversation";
        setError(msg);
        setErrorType("db");
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // ── Build user message (only add to messages if not retrying) ──
      const userMsg: ChatMessage = {
        id: generateId(),
        conversationId: convId,
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
        tokens: 0,
      };

      let updatedMessages: ChatMessage[];
      if (!retry) {
        updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        try {
          await saveMessage(convId, userMsg);
        } catch (err) {
          console.error("[waifu] Failed to save user message:", err);
        }
      } else {
        updatedMessages = messages;
      }

      // ── Build compressed API payload ──
      const conv = conversationRef.current;
      const summaries = conv?.summaries ?? [];
      const recentMessages = messages.slice(-5);

      const apiMessages = buildContextWithSummaries(
        character.systemPrompt,
        summaries,
        recentMessages,
        userMessage,
      );

      // ── API call with retry ──
      let result;
      let lastErr: unknown;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delay = Math.min(1000 * 2 ** attempt, 8000);
          console.log(`[waifu] Retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }

        try {
          result = await chatWithWaifu(apiMessages, character.name);
          lastErr = undefined;
          break;
        } catch (err) {
          lastErr = err;
          const { type } = classifyError(err);
          // Don't retry auth or credit errors
          if (
            type === "api" &&
            (String(err).includes("401") ||
              String(err).includes("402") ||
              String(err).includes("api key") ||
              String(err).includes("credits"))
          ) {
            break;
          }
          console.warn(`[waifu] Attempt ${attempt + 1} failed:`, err);
        }
      }

      if (lastErr || !result) {
        if (!retry) {
          setMessages(updatedMessages.slice(0, -1));
        }
        const { friendly, type } = classifyError(lastErr);
        setError(friendly);
        setErrorType(type);
        retryCountRef.current = retryCountRef.current + 1;
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      retryCountRef.current = 0;

      // ── Build assistant message ──
      const assistantMsg: ChatMessage = {
        id: generateId(),
        conversationId: convId,
        role: "assistant",
        content: result.content,
        timestamp: Date.now(),
        tokens: result.tokens.total,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      try {
        await saveMessage(convId, assistantMsg);
      } catch (err) {
        console.error("[waifu] Failed to save assistant message:", err);
      }

      trackTokenUsage(result.tokens.total, character.name);

      // ── Auto-summarize (non-blocking) ──
      const totalAfter = (conv?.totalMessages ?? 0) + 2;
      if (totalAfter > SUMMARIZE_THRESHOLD) {
        const oldMsgCount = messages.length;

        checkAndAutoSummarize(convId, SUMMARIZE_THRESHOLD).then(async (didRun) => {
          if (didRun) {
            console.log(`[waifu] Auto-summarized conversation (${oldMsgCount} messages)`);
            setOptimized(true);

            const updated = await db.conversations.get(convId);
            if (updated) {
              conversationRef.current = {
                id: updated.id,
                totalMessages: updated.totalMessages,
                summaries: updated.summaries,
              };
            }
          }
        });
      }

      setLoading(false);
      loadingRef.current = false;
    },
    [characterId, character, messages, clearError],
  );

  /* ── Retry last send ─────────────────────────────────────── */

  const retrySend = useCallback(() => {
    const msg = pendingMessageRef.current;
    if (msg) {
      sendMessage(msg, true);
    }
  }, [sendMessage]);

  /* ── Clear conversation ─────────────────────────────────── */

  const clearConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await deleteConversation(conversationId);
      conversationRef.current = null;
      setConversationId(null);
      setMessages([]);
      clearError();
      setOptimized(false);
      console.log("[waifu] Conversation cleared");
    } catch (err) {
      const { friendly } = classifyError(err);
      console.error("[waifu]", friendly);
      setError(friendly);
      setErrorType("db");
    }
  }, [conversationId, clearError]);

  /* ── Return ─────────────────────────────────────────────── */

  return {
    messages,
    sendMessage,
    retrySend,
    loading,
    error,
    errorType,
    clearError,
    conversationId,
    loadConversation: loadChat,
    clearConversation,
    optimized,
  };
}
