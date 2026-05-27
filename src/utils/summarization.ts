import db from "../db/schema";
import { chatWithWaifu } from "../api/openrouter";
import type { ChatMessage, Conversation } from "../db/schema";

/* ── Constants ──────────────────────────────────────────── */

const RECENT_COUNT = 5;
const DEFAULT_THRESHOLD = 15;
const SUMMARY_PREFIX = "[Summary]: ";

/* ── 1. Summarize messages ──────────────────────────────── */

export async function summarizeMessages(
  messages: ChatMessage[],
  characterName?: string,
): Promise<string> {
  const systemPrompt = [
    "You are a summarization assistant. Summarize the following conversation",
    "in 2-3 concise sentences. Focus on key topics discussed, the user's",
    "preferences, opinions, and any personal details revealed. Omit small talk.",
  ].join(" ");

  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const result = await chatWithWaifu(apiMessages, characterName);

  const summary = result.content.trim();
  const tokensSaved = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  console.log(
    `[summarization] Created ${summary.split(" ").length}-word summary ` +
      `(~${tokensSaved} tokens saved, cost ${result.tokens.total} tokens)`,
  );

  return summary;
}

/* ── Token estimate helper ──────────────────────────────── */

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/* ── 2. Check and auto-summarize ────────────────────────── */

export async function checkAndAutoSummarize(
  conversationId: string,
  threshold: number = DEFAULT_THRESHOLD,
): Promise<boolean> {
  try {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) {
      console.warn("[summarization] Conversation not found:", conversationId);
      return false;
    }

    if (conversation.totalMessages <= threshold) {
      return false;
    }

    const allMessages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");

    const keepCount = RECENT_COUNT;
    const toSummarize = allMessages.slice(0, allMessages.length - keepCount);

    if (toSummarize.length === 0) return false;

    console.log(
      `[summarization] ${conversation.totalMessages} messages exceeds threshold ${threshold}. ` +
        `Summarizing ${toSummarize.length} old messages, keeping ${keepCount} recent.`,
    );

    const summary = await summarizeMessages(toSummarize);

    const newSummary = {
      period: `messages ${toSummarize[0].timestamp}-${toSummarize[toSummarize.length - 1].timestamp}`,
      summary,
      createdAt: Date.now(),
      messageRange: [toSummarize[0].timestamp, toSummarize[toSummarize.length - 1].timestamp] as [number, number],
    };

    const updatedSummaries = [...(conversation.summaries || []), newSummary];

    await db.transaction("rw", db.conversations, db.messages, async () => {
      await db.conversations.update(conversationId, {
        summaries: updatedSummaries,
      });

      await db.messages
        .where("conversationId")
        .equals(conversationId)
        .and((m) => m.timestamp <= toSummarize[toSummarize.length - 1].timestamp)
        .delete();
    });

    console.log(
      `[summarization] Done. ${toSummarize.length} messages archived into 1 summary. ` +
        `Remaining messages in DB: ${keepCount}`,
    );

    return true;
  } catch (error) {
    console.warn("[summarization] Failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/* ── 3. Build context with summaries ────────────────────── */

export function buildContextWithSummaries(
  characterSystemPrompt: string,
  summaries: Conversation["summaries"],
  recentMessages: ChatMessage[],
  newUserContent: string,
  maxRecent: number = 7,
): { role: string; content: string }[] {
  const result: { role: string; content: string }[] = [
    { role: "system", content: characterSystemPrompt },
  ];

  const recentSummaries = summaries.slice(-2);
  for (const s of recentSummaries) {
    result.push({
      role: "system",
      content: `${SUMMARY_PREFIX}${s.summary}`,
    });
  }

  const recent = recentMessages.slice(-maxRecent);
  for (const m of recent) {
    result.push({ role: m.role, content: m.content });
  }

  result.push({ role: "user", content: newUserContent });

  const totalTokens = result.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );

  console.log(
    `[summarization] Context built: ${result.length} messages ` +
      `(1 system + ${recentSummaries.length} summaries + ` +
      `${recent.length} recent + 1 user) ~${totalTokens} estimated tokens`,
  );

  return result;
}
