import { create } from "zustand";
import type {
  ChatMessage,
  Conversation,
  Character,
} from "../db/schema";
import db from "../db/schema";
import { sendChat } from "../api";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;

  loadConversations: () => Promise<void>;
  createConversation: (characterId: string) => Promise<string>;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  getMessages: (conversationId: string) => Promise<ChatMessage[]>;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useChat = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  loading: false,

  async loadConversations() {
    const conversations = await db.conversations
      .orderBy("updatedAt")
      .reverse()
      .toArray();
    set({ conversations });
  },

  async createConversation(characterId: string) {
    const id = generateId();
    const now = Date.now();
    const conversation: Conversation = {
      id,
      characterId,
      name: "New conversation",
      messages: [],
      summaries: [],
      createdAt: now,
      updatedAt: now,
      totalMessages: 0,
    };
    await db.conversations.add(conversation);
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  setActiveConversation(id: string) {
    set({ activeConversationId: id });
  },

  async getMessages(conversationId: string) {
    return db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
  },

  async sendMessage(content: string) {
    const { activeConversationId, conversations } = get();
    if (!activeConversationId) return;

    const conversation = conversations.find(
      (c) => c.id === activeConversationId,
    );
    if (!conversation) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      conversationId: activeConversationId,
      role: "user",
      content,
      timestamp: Date.now(),
      tokens: 0,
    };

    await db.messages.add(userMessage);
    await db.conversations.update(activeConversationId, {
      totalMessages: conversation.totalMessages + 1,
      updatedAt: Date.now(),
    });

    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              totalMessages: c.totalMessages + 1,
              updatedAt: Date.now(),
            }
          : c,
      ),
      loading: true,
    }));

    try {
      const allMessages = await db.messages
        .where("conversationId")
        .equals(activeConversationId)
        .sortBy("timestamp");

      const response = await sendChat({
        model: "gpt-3.5-turbo",
        messages: allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        conversationId: activeConversationId,
        role: "assistant",
        content: response.choices[0].message.content,
        timestamp: Date.now(),
        tokens: response.usage?.total_tokens ?? 0,
      };

      await db.messages.add(assistantMessage);
      await db.conversations.update(activeConversationId, {
        totalMessages: conversation.totalMessages + 2,
        updatedAt: Date.now(),
      });

      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messages: [...c.messages, assistantMessage],
                totalMessages: c.totalMessages + 1,
                updatedAt: Date.now(),
              }
            : c,
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
