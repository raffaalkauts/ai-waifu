// ============================================================
// AI WAIFU CHAT - COMPLETE STARTER BOILERPLATE
// ============================================================

// ============================================================
// 1. DATABASE SCHEMA (db/schema.ts)
// ============================================================

import Dexie, { Table } from "dexie";

export interface ChatMessage {
  id?: number;
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
  id?: string;
  characterId: string;
  name: string;
  messages: ChatMessage[];
  summaries: ConversationSummary[];
  createdAt: number;
  updatedAt: number;
  totalMessages: number;
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

export class ChatDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<ChatMessage>;
  characters!: Table<Character>;

  constructor() {
    super("WaifuChatDB");
    this.version(1).schemas({
      conversations: "++id, characterId, updatedAt",
      messages: "++id, conversationId, timestamp",
      characters: "++id",
    });
  }
}

export const db = new ChatDatabase();

// ============================================================
// 2. OPENROUTER API CLIENT (api/openrouter.ts)
// ============================================================

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  top_p: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = import.meta.env.VITE_OPENROUTER_BASE_URL ||
  "https://openrouter.io/api/v1";

export async function chatWithWaifu(
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>,
  characterName: string
): Promise<{
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "VITE_OPENROUTER_API_KEY not set. Add it to .env.local"
    );
  }

  const request: OpenRouterRequest = {
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: messages,
    max_tokens: 150,
    temperature: 0.8,
    top_p: 0.95,
  };

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI Waifu Chat",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter error: ${error.error?.message || response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();

    return {
      content: data.choices[0].message.content,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
    };
  } catch (error) {
    console.error("OpenRouter API error:", error);
    throw error;
  }
}

// ============================================================
// 3. TOKEN UTILS (utils/tokenUtils.ts)
// ============================================================

export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function trackTokenUsage(
  totalTokens: number,
  characterName: string
) {
  const usage = JSON.parse(localStorage.getItem("tokenUsage") || "{}");
  const today = new Date().toISOString().split("T")[0];

  usage[today] = {
    total: (usage[today]?.total || 0) + totalTokens,
    timestamp: Date.now(),
  };

  localStorage.setItem("tokenUsage", JSON.stringify(usage));

  // Calculate monthly total
  const monthlyTotal = Object.values(usage).reduce(
    (sum: number, day: any) => sum + (day.total || 0),
    0
  );

  console.log(
    `📊 Token usage: ${monthlyTotal}/100,000 monthly budget (${
      ((monthlyTotal / 100000) * 100).toFixed(1)
    }%)`
  );

  if (monthlyTotal > 80000) {
    console.warn("⚠️ Approaching monthly token limit!");
  }

  return monthlyTotal;
}

export function getTokenBudgetStatus() {
  const usage = JSON.parse(localStorage.getItem("tokenUsage") || "{}");
  const monthlyTotal = Object.values(usage).reduce(
    (sum: number, day: any) => sum + (day.total || 0),
    0
  );

  return {
    used: monthlyTotal,
    limit: 100000,
    remaining: 100000 - monthlyTotal,
    percentage: (monthlyTotal / 100000) * 100,
    status: monthlyTotal > 80000 ? "warning" : "ok",
  };
}

// ============================================================
// 4. SUMMARIZATION UTILS (utils/summarization.ts)
// ============================================================

export async function summarizeMessages(
  messages: ChatMessage[],
  character: Character
): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "User" : character.name}: ${m.content}`)
    .join("\n");

  const summaryPrompt = `Summarize this conversation in 2-3 short sentences, focusing on key facts and feelings:

${conversationText}

Summary:`;

  try {
    const response = await chatWithWaifu(
      [
        {
          role: "system",
          content: "You are a helpful summarizer. Be concise.",
        },
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      "summarizer"
    );

    return response.content;
  } catch (error) {
    console.error("Summarization failed:", error);
    return "Conversation summary unavailable";
  }
}

export async function checkAndAutoSummarize(
  conversationId: string,
  threshold: number = 15
) {
  const conversation = await db.conversations.get(conversationId);
  if (!conversation || conversation.messages.length < threshold) {
    return;
  }

  // Get character for context
  const character = await db.characters.get(conversation.characterId);
  if (!character) return;

  // Summarize oldest messages
  const messagesToSummarize = conversation.messages.slice(0, threshold - 5);
  const summary = await summarizeMessages(messagesToSummarize, character);

  // Add to summaries and remove old messages
  conversation.summaries.push({
    period: `messages_0_to_${threshold - 5}`,
    summary: summary,
    createdAt: Date.now(),
    messageRange: [0, threshold - 5],
  });

  conversation.messages = conversation.messages.slice(threshold - 5);

  await db.conversations.update(conversationId, {
    messages: conversation.messages,
    summaries: conversation.summaries,
  });
}

// ============================================================
// 5. CUSTOM HOOK (hooks/useWaifuChat.ts)
// ============================================================

import { useState, useCallback, useEffect } from "react";

export function useWaifuChat(characterId: string, character: Character) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load existing conversation
  const loadConversation = useCallback(async () => {
    try {
      const conversation = await db.conversations
        .where("characterId")
        .equals(characterId)
        .last();

      if (conversation) {
        setMessages(conversation.messages);
        setConversationId(conversation.id!);
      } else {
        setMessages([]);
        setConversationId(null);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
    }
  }, [characterId]);

  useEffect(() => {
    loadConversation();
  }, [characterId, loadConversation]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      setLoading(true);
      setError(null);

      try {
        // Get or create conversation
        let conversation = await db.conversations
          .where("characterId")
          .equals(characterId)
          .last();

        if (!conversation) {
          const newId = `${characterId}_${Date.now()}`;
          await db.conversations.add({
            id: newId,
            characterId: characterId,
            name: character.name,
            messages: [],
            summaries: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            totalMessages: 0,
          });
          conversation = (await db.conversations.get(newId))!;
          setConversationId(newId);
        }

        // Build API message list with context
        const apiMessages: any[] = [
          {
            role: "system",
            content: character.systemPrompt,
          },
        ];

        // Add summaries if any
        if (conversation.summaries.length > 0) {
          const recentSummaries = conversation.summaries.slice(-2);
          const summaryText = recentSummaries
            .map((s) => `[Earlier conversation]: ${s.summary}`)
            .join("\n");

          apiMessages.push({
            role: "system",
            content: summaryText,
          });
        }

        // Add recent message history (last 5 messages)
        const recentMessages = conversation.messages.slice(-5);
        apiMessages.push(...recentMessages);

        // Add user message
        apiMessages.push({
          role: "user",
          content: userMessage,
        });

        // Get response from OpenRouter
        const result = await chatWithWaifu(apiMessages, character.name);

        // Track token usage
        trackTokenUsage(result.tokens.total, character.name);

        // Create message entries
        const userMsg: ChatMessage = {
          conversationId: conversation.id!,
          role: "user",
          content: userMessage,
          timestamp: Date.now(),
          tokens: result.tokens.prompt,
        };

        const assistantMsg: ChatMessage = {
          conversationId: conversation.id!,
          role: "assistant",
          content: result.content,
          timestamp: Date.now(),
          tokens: result.tokens.completion,
        };

        // Update local state
        const newMessages = [...messages, userMsg, assistantMsg];
        setMessages(newMessages);

        // Save to database
        conversation.messages = newMessages;
        conversation.totalMessages = newMessages.length;
        conversation.updatedAt = Date.now();

        await db.conversations.update(conversation.id!, {
          messages: newMessages,
          totalMessages: newMessages.length,
          updatedAt: Date.now(),
        });

        // Check if auto-summarize needed
        await checkAndAutoSummarize(conversation.id!, 15);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error("Chat error:", err);
      } finally {
        setLoading(false);
      }
    },
    [characterId, character, messages]
  );

  const clearConversation = useCallback(async () => {
    if (conversationId) {
      await db.conversations.delete(conversationId);
      setMessages([]);
      setConversationId(null);
    }
  }, [conversationId]);

  return {
    messages,
    sendMessage,
    loading,
    error,
    conversationId,
    loadConversation,
    clearConversation,
  };
}

// ============================================================
// 6. CHARACTER DATA (data/characters.ts)
// ============================================================

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "mika",
    name: "Mika",
    description: "A tsundere girl with a warm heart",
    avatar: "👱‍♀️",
    systemPrompt: `You are Mika, a 17-year-old tsundere girl.
    
Personality: You're tough on the outside but caring inside. You love anime and manga.

Speech style: You say things like "It's not like I care about you or anything!" when you actually do care.
Catchphrases: "Baka!", "Hmpf!", "I-It's not what you think!"
Mannerisms: You blush easily and avoid eye contact when shy.

Keep responses to 1-3 sentences. Always stay in character.`,
    personality: "tsundere",
    speechStyle: "teasing but caring",
    interests: ["anime", "manga", "romance"],
  },
  {
    id: "yuki",
    name: "Yuki",
    description: "A calm, composed kuudere girl",
    avatar: "🧊",
    systemPrompt: `You are Yuki, a 16-year-old kuudere girl.
    
Personality: You're cool and composed, speaking in a straightforward manner.

Speech style: You speak in a monotone, direct way. Rarely smile.
Catchphrases: "I see.", "How logical.", "That's interesting."
Mannerisms: Calm, collected, hints of emotion beneath the surface.

Keep responses to 1-2 sentences. Stay cool and analytical.`,
    personality: "kuudere",
    speechStyle: "calm and analytical",
    interests: ["science fiction", "gaming", "technology"],
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "A cheerful, energetic dere girl",
    avatar: "🌸",
    systemPrompt: `You are Sakura, a 16-year-old cheerful girl.
    
Personality: You're upbeat, warm, and genuinely kind to everyone.

Speech style: You're enthusiastic and expressive. Use lots of exclamation marks!
Catchphrases: "That's amazing!", "I'm so happy to meet you!", "Let's be friends!"
Mannerisms: Always smiling, full of energy, quick to support others.

Keep responses to 2-3 sentences. Be warm and encouraging.`,
    personality: "deredere",
    speechStyle: "warm and enthusiastic",
    interests: ["friends", "nature", "helping others"],
  },
];

// ============================================================
// 7. MAIN CHAT COMPONENT (components/ChatWindow.tsx)
// ============================================================

import React, { useRef, useEffect } from "react";

export interface ChatWindowProps {
  character: Character;
  messages: ChatMessage[];
  loading: boolean;
  error?: string;
  onSendMessage: (message: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  character,
  messages,
  loading,
  error,
  onSendMessage,
}) => {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 p-4 shadow-sm">
        <h2 className="text-2xl font-bold text-purple-700">{character.name}</h2>
        <p className="text-sm text-gray-600">{character.description}</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation with {character.name}...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-purple-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-pink-200 rounded-bl-none"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-pink-200 px-4 py-2 rounded-lg">
              <p className="text-gray-600">
                {character.name} is thinking... <span className="animate-pulse">●</span>
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-red-700">
              <p>Error: {error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-pink-200 p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Chat with ${character.name}...`}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// 8. APP COMPONENT (App.tsx)
// ============================================================

import React, { useState, useEffect } from "react";

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);

  useEffect(() => {
    // Load default characters into database
    const loadCharacters = async () => {
      const existing = await db.characters.toArray();
      if (existing.length === 0) {
        await db.characters.bulkAdd(DEFAULT_CHARACTERS);
      }
      setCharacters(DEFAULT_CHARACTERS);
    };

    loadCharacters();
  }, []);

  if (showCharacterSelect || !selectedCharacterId) {
    const selectedChar = characters.find((c) => c.id === selectedCharacterId);
    if (!selectedChar) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-purple-700 mb-2 text-center">
              AI Waifu Chat
            </h1>
            <p className="text-center text-gray-600 mb-12">
              Choose a character to chat with
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    setSelectedCharacterId(character.id);
                    setShowCharacterSelect(false);
                  }}
                  className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-5xl mb-4">{character.avatar}</div>
                  <h2 className="text-2xl font-bold text-purple-700 mb-2">
                    {character.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{character.description}</p>
                  <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                    Chat
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  if (selectedCharacterId) {
    const character = characters.find((c) => c.id === selectedCharacterId);
    if (character) {
      return <ChatApp character={character} onBack={() => setShowCharacterSelect(true)} />;
    }
  }

  return null;
}

// ============================================================
// 9. CHAT APP WRAPPER (components/ChatApp.tsx)
// ============================================================

export interface ChatAppProps {
  character: Character;
  onBack: () => void;
}

export const ChatApp: React.FC<ChatAppProps> = ({ character, onBack }) => {
  const { messages, sendMessage, loading, error } = useWaifuChat(
    character.id,
    character
  );

  return (
    <div className="flex flex-col h-screen">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        ← Back
      </button>

      <ChatWindow
        character={character}
        messages={messages}
        loading={loading}
        error={error}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

// ============================================================
// 10. SETUP INSTRUCTIONS FOR .env.local
// ============================================================

/*
Create a file named .env.local in your project root:

VITE_OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
VITE_OPENROUTER_BASE_URL=https://openrouter.io/api/v1

Get your API key from: https://openrouter.io/
*/

// ============================================================
// 11. VITE CONFIG (vite.config.ts)
// ============================================================

/*
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
*/

// ============================================================
// 12. PACKAGE.JSON DEPENDENCIES
// ============================================================

/*
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "dexie": "^4.0.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
*/
