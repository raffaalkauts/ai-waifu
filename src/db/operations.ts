import db from "./schema";
import type { ChatMessage, Conversation, Character } from "./schema";

const log = (label: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[db] ${label}`, ...args);
  }
};

const warn = (label: string, error: unknown) => {
  console.warn(`[db] ${label} —`, error instanceof Error ? error.message : error);
};

/* ── Helpers ────────────────────────────────────────────── */

function generateId(): string {
  return crypto.randomUUID();
}

/* ── Conversations ──────────────────────────────────────── */

export async function loadConversation(
  characterId: string,
): Promise<Conversation | null> {
  try {
    const conversation = await db.conversations
      .where("characterId")
      .equals(characterId)
      .last();

    if (!conversation) {
      log("loadConversation", "none found for", characterId);
      return null;
    }

    const messages = await db.messages
      .where("conversationId")
      .equals(conversation.id)
      .sortBy("timestamp");

    conversation.messages = messages;
    log("loadConversation", conversation.id, `${messages.length} messages`);
    return conversation;
  } catch (error) {
    warn("loadConversation failed", error);
    return null;
  }
}

export async function createConversation(
  characterId: string,
  characterName: string,
): Promise<Conversation> {
  const now = Date.now();
  const conversation: Conversation = {
    id: generateId(),
    characterId,
    name: characterName,
    messages: [],
    summaries: [],
    createdAt: now,
    updatedAt: now,
    totalMessages: 0,
  };

  try {
    await db.conversations.add(conversation);
    log("createConversation", conversation.id);
    return conversation;
  } catch (error) {
    warn("createConversation failed", error);
    throw error;
  }
}

export async function deleteConversation(
  conversationId: string,
): Promise<boolean> {
  try {
    await db.transaction("rw", db.conversations, db.messages, async () => {
      await db.messages.where("conversationId").equals(conversationId).delete();
      await db.conversations.delete(conversationId);
    });
    log("deleteConversation", conversationId);
    return true;
  } catch (error) {
    warn("deleteConversation failed", error);
    return false;
  }
}

/* ── Messages ───────────────────────────────────────────── */

export async function saveMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<void> {
  try {
    await db.transaction("rw", db.messages, db.conversations, async () => {
      await db.messages.add(message);
      const conv = await db.conversations.get(conversationId);
      if (conv) {
        await db.conversations.update(conversationId, {
          totalMessages: conv.totalMessages + 1,
          updatedAt: Date.now(),
        });
      }
    });
    log("saveMessage", message.id, message.role);
  } catch (error) {
    warn("saveMessage failed", error);
    throw error;
  }
}

export async function getConversationHistory(
  conversationId: string,
  limit: number = 50,
): Promise<ChatMessage[]> {
  try {
    const messages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .reverse()
      .limit(limit)
      .toArray();

    messages.reverse();

    log("getConversationHistory", conversationId, `${messages.length} messages`);
    return messages;
  } catch (error) {
    warn("getConversationHistory failed", error);
    return [];
  }
}

/* ── Characters ─────────────────────────────────────────── */

export async function loadCharacters(): Promise<Character[]> {
  try {
    const characters = await db.characters.toArray();
    log("loadCharacters", `${characters.length} characters`);
    return characters;
  } catch (error) {
    warn("loadCharacters failed", error);
    return [];
  }
}

export async function saveCharacter(character: Character): Promise<void> {
  try {
    await db.characters.put(character);
    log("saveCharacter", character.id, character.name);
  } catch (error) {
    warn("saveCharacter failed", error);
    throw error;
  }
}
