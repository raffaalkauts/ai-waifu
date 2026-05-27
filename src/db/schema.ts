import Dexie, { type EntityTable } from "dexie";

/* ── Interfaces ─────────────────────────────────────────── */

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokens: number;
}

export interface ConversationSummary {
  period: string;
  summary: string;
  createdAt: number;
  messageRange: [number, number];
}

export interface Conversation {
  id: string;
  characterId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  totalMessages: number;

  messages: ChatMessage[];
  summaries: ConversationSummary[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  personality: string;
  speechStyle: string;
  interests: string[];
}

/* ── Database Class ─────────────────────────────────────── */

class ChatDatabase extends Dexie {
  conversations!: EntityTable<Conversation, "id">;
  messages!: EntityTable<ChatMessage, "id">;
  characters!: EntityTable<Character, "id">;

  constructor() {
    super("ai-waifu");

    this.version(1).stores({
      conversations: "id, characterId, updatedAt",
      messages: "id, conversationId, timestamp",
      characters: "id, name",
    });

    this.version(2).stores({
      conversations: "id, characterId, updatedAt",
      messages: "id, conversationId, timestamp, role",
      characters: "id, name, interests",
    });
  }
}

const db = new ChatDatabase();
export default db;
