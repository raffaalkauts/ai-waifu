import db from "../db/schema";
import type { ChatMessage, Conversation, Character } from "../db/schema";

/* ── Types ──────────────────────────────────────────────── */

interface ExportPayload {
  version: 1;
  exportedAt: number;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  messages: ChatMessage[];
  totalMessages: number;
}

interface ImportResult {
  success: boolean;
  conversationId: string | null;
  error?: string;
}

/* ── Helpers ────────────────────────────────────────────── */

function dateTag(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Export as JSON ─────────────────────────────────────── */

export async function exportConversationAsJSON(conversationId: string) {
  const conv = await db.conversations.get(conversationId);
  if (!conv) throw new Error("Conversation not found");

  const character: Character | undefined = conv.characterId
    ? await db.characters.get(conv.characterId)
    : undefined;

  const messages = await db.messages
    .where("conversationId")
    .equals(conversationId)
    .sortBy("timestamp");

  const payload: ExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    characterId: conv.characterId,
    characterName: character?.name ?? conv.name,
    characterAvatar: character?.avatar ?? "",
    messages,
    totalMessages: messages.length,
  };

  const json = JSON.stringify(payload, null, 2);
  const tag = dateTag();
  triggerDownload(json, `conversation_${tag}.json`, "application/json");
}

/* ── Export as Text ──────────────────────────────────────── */

export async function exportConversationAsText(conversationId: string) {
  const conv = await db.conversations.get(conversationId);
  if (!conv) throw new Error("Conversation not found");

  const character: Character | undefined = conv.characterId
    ? await db.characters.get(conv.characterId)
    : undefined;

  const messages = await db.messages
    .where("conversationId")
    .equals(conversationId)
    .sortBy("timestamp");

  const name = character?.name ?? conv.name;
  const lines: string[] = [
    `Conversation with ${name}`,
    `Exported: ${formatTimestamp(Date.now())}`,
    `Messages: ${messages.length}`,
    "─".repeat(48),
    "",
  ];

  for (const msg of messages) {
    const label = msg.role === "user" ? "You" : msg.role === "assistant" ? name : "System";
    const time = formatTimestamp(msg.timestamp);
    lines.push(`[${label}] (${time})`);
    lines.push(msg.content);
    lines.push("");
  }

  const text = lines.join("\n");
  const tag = dateTag();
  triggerDownload(text, `conversation_${tag}.txt`, "text/plain");
}

/* ── Import ──────────────────────────────────────────────── */

export async function importConversation(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const payload: ExportPayload = JSON.parse(text);

    if (!payload.version || !payload.messages || !Array.isArray(payload.messages)) {
      return { success: false, conversationId: null, error: "Invalid file format" };
    }

    if (payload.messages.length === 0) {
      return { success: false, conversationId: null, error: "No messages to import" };
    }

    const now = Date.now();
    const convId = generateId();

    const conv: Conversation = {
      id: convId,
      characterId: payload.characterId,
      name: payload.characterName,
      messages: [],
      summaries: [],
      createdAt: now,
      updatedAt: now,
      totalMessages: payload.messages.length,
    };

    const msgs: ChatMessage[] = payload.messages.map((m) => ({
      id: generateId(),
      conversationId: convId,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      tokens: m.tokens ?? 0,
    }));

    await db.transaction("rw", db.conversations, db.messages, async () => {
      await db.conversations.add(conv);
      await db.messages.bulkAdd(msgs);
    });

    return { success: true, conversationId: convId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown import error";
    return { success: false, conversationId: null, error: msg };
  }
}
