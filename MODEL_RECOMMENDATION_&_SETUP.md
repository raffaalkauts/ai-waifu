# OpenRouter Model Recommendation & Setup Guide

## 🏆 Model Comparison for Free Tier

### Your Winner: **Llama 3.1 8B Instruct**

```
Model ID: meta-llama/llama-3.1-8b-instruct:free
├─ Provider: Meta
├─ Cost: FREE (OpenRouter)
├─ Context: 8K tokens
├─ Speed: ~1-2 seconds
├─ Quality: Good (7/10)
└─ Best for: Personality chat, conversational AI
```

### Why This Choice?
| Aspect | Score | Reason |
|--------|-------|--------|
| **Cost** | 10/10 | Completely free |
| **Speed** | 9/10 | 1-2s latency (great for waifu chat) |
| **Quality** | 7/10 | Good enough for casual RP & personality |
| **Personality** | 8/10 | Great for character consistency |
| **Context** | 6/10 | 8K tokens (limited but OK for chat) |

### Backup Options (Also Free)
```
1. Mistral 7B Instruct:free
   - Better quality (7.5/10)
   - Similar speed
   - Better structured outputs
   
2. Phi-3:free
   - Smaller, faster
   - Lower quality
   - Use as fallback

3. Qwen models:free (jika available)
   - Bilingual (Chinese + English)
   - Good quality
```

---

## ⚙️ Setup Instructions

### Step 1: Get OpenRouter API Key
```bash
1. Go to https://openrouter.io/
2. Click "Sign Up" → Create account (no credit card needed)
3. Go to Settings → API Keys
4. Click "Create Key"
5. Save ke environment variable: OPENROUTER_API_KEY
```

### Step 2: Environment Setup
```bash
# .env.local (di root project)
VITE_OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
VITE_OPENROUTER_BASE_URL=https://openrouter.io/api/v1
```

⚠️ **Security Note**: 
- Jangan hardcode API key di frontend production
- Better: Pakai backend proxy (Express server)
- Backend hold API key, frontend call backend

---

## 🔧 Implementation Code

### Option A: Frontend Direct Call (Simplest, untuk development)

```typescript
// api/openrouter.ts
const OPENROUTER_BASE_URL = "https://openrouter.io/api/v1";
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatWithWaifu(
  messages: ChatMessage[],
  characterName: string
): Promise<string> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
        "X-Title": "AI Waifu Chat", // Optional
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: messages,
        max_tokens: 150, // Keep responses short
        temperature: 0.8, // Balanced: creative but consistent
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Chat API error:", error);
    throw error;
  }
}
```

### Option B: Backend Proxy (Recommended for Production)

```typescript
// backend/routes/chat.ts
import express from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";

const router = express.Router();
const API_KEY = process.env.OPENROUTER_API_KEY;

// Rate limiting: 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
});

router.post("/api/chat", limiter, async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post(
      "https://openrouter.io/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: messages,
        max_tokens: 150,
        temperature: 0.8,
        top_p: 0.95,
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "HTTP-Referer": "https://yourapp.com",
          "X-Title": "AI Waifu Chat",
        },
      }
    );

    res.json({
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to get response" });
  }
});

export default router;
```

---

## 📝 System Prompt Engineering for Personality

### Template System Prompt (Keep under 500 tokens)

```javascript
const CHARACTER_PROFILES = {
  mika: {
    systemPrompt: `You are Mika, a 17-year-old tsundere girl with long purple hair.
    
Personality: You act tough and cold on the outside, but you're actually caring and warm inside.
You love anime and manga, especially romance series.

Speech style: You often say "It's not like I care about you or anything!" when you're actually concerned.
Common phrases: "Baka!", "Hmpf!", "I-It's not what you think!"
Mannerisms: You blush easily, avoid eye contact when shy, fidget with hair.

Important rules:
- ALWAYS stay in character as Mika
- Keep responses short (1-3 sentences max)
- Be playful and teasing, but ultimately kind
- Show your tsundere personality clearly`,
    
    context: {
      name: "Mika",
      age: 17,
      appearance: "Long purple hair, red eyes, elegant",
      type: "tsundere"
    }
  },

  yuki: {
    systemPrompt: `You are Yuki, a 16-year-old kuudere (cool type) girl.
    
Personality: You're calm, composed, and speak in a straightforward manner.
You like computers, gaming, and science fiction.

Speech style: Monotone, direct, sometimes uses technical jargon.
Common phrases: "I see.", "That's interesting.", "How logical."
Mannerisms: Dead-pan expression, rarely smiles, blinks slowly.

Important rules:
- Stay cool and composed at all times
- Be intelligent and analytical in responses
- Show slight emotional hints beneath the cold exterior
- Keep responses concise (1-2 sentences)`,
    
    context: {
      name: "Yuki",
      age: 16,
      appearance: "Short silver hair, pale skin, dark eyes",
      type: "kuudere"
    }
  }
};
```

### How to Inject System Prompt Locally (Don't send to API)

```typescript
// hooks/useCharacterChat.ts
import { useState } from "react";
import { chatWithWaifu } from "../api/openrouter";

interface UseCharacterChatProps {
  character: Character;
}

export function useCharacterChat({ character }: UseCharacterChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (userMessage: string) => {
    setLoading(true);

    // Build conversation with LOCAL system prompt injection
    const conversationMessages = [
      // LOCAL injection - not sent to OpenRouter (ideally)
      // But OpenRouter counts it, so we keep it short
      {
        role: "system" as const,
        content: character.systemPrompt,
      },
      // Recent conversation history
      ...messages.slice(-6), // Keep last 6 messages only
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    try {
      const response = await chatWithWaifu(conversationMessages, character.name);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Failed to get response:", error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
```

---

## 💾 IndexedDB Setup for Memory

### Database Schema

```typescript
// db/schema.ts
import Dexie, { Table } from "dexie";

interface Message {
  id?: number;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tokens: number;
}

interface Conversation {
  id?: string;
  characterId: string;
  messages: Message[];
  summaries: ConversationSummary[];
  createdAt: number;
  updatedAt: number;
  totalMessages: number;
}

interface ConversationSummary {
  period: string; // "messages_1-15"
  summary: string; // 2-3 sentences
  createdAt: number;
  messageRange: [number, number];
}

export class ChatDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;

  constructor() {
    super("WaifuChatDB");
    this.version(1).stores({
      conversations: "++id, characterId, updatedAt",
      messages: "++id, conversationId, timestamp",
    });
  }
}

export const db = new ChatDatabase();
```

### Summarization Implementation

```typescript
// utils/summarization.ts
import { db } from "../db/schema";
import { chatWithWaifu } from "../api/openrouter";

export async function summarizeConversation(
  conversationId: string,
  messageStart: number,
  messageEnd: number
) {
  const conversation = await db.conversations.get(conversationId);
  if (!conversation) return;

  const messagesToSummarize = conversation.messages.slice(
    messageStart,
    messageEnd
  );

  // Build summary request
  const summaryPrompt = `Summarize this conversation concisely in 2-3 sentences, focusing on key points and feelings expressed:

${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join("\n")}

Summary:`;

  const summary = await chatWithWaifu(
    [
      {
        role: "user",
        content: summaryPrompt,
      },
    ],
    "summarizer"
  );

  // Save summary
  const newSummary = {
    period: `messages_${messageStart}-${messageEnd}`,
    summary: summary,
    createdAt: Date.now(),
    messageRange: [messageStart, messageEnd] as [number, number],
  };

  conversation.summaries.push(newSummary);

  // Remove old messages from active context
  conversation.messages = conversation.messages.slice(messageEnd);

  await db.conversations.update(conversationId, {
    summaries: conversation.summaries,
    messages: conversation.messages,
  });
}

// Auto-trigger summarization
export function checkAndSummarize(
  conversationId: string,
  messageThreshold: number = 15
) {
  db.conversations.get(conversationId).then((conv) => {
    if (conv && conv.messages.length > messageThreshold) {
      summarizeConversation(conversationId, 0, messageThreshold - 5);
    }
  });
}
```

---

## 🎬 Full Chat Hook with Memory Management

```typescript
// hooks/useWaifuChat.ts
import { useState, useCallback } from "react";
import { db } from "../db/schema";
import { chatWithWaifu } from "../api/openrouter";
import {
  checkAndSummarize,
} from "../utils/summarization";

interface UseWaifuChatProps {
  characterId: string;
  character: Character;
}

export function useWaifuChat({
  characterId,
  character,
}: UseWaifuChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  // Load previous conversation
  const loadConversation = useCallback(async () => {
    const conversation = await db.conversations
      .where("characterId")
      .equals(characterId)
      .last();

    if (conversation) {
      setMessages(conversation.messages);
      // Calculate token usage from stored data
      const tokens = conversation.messages.reduce((sum, m) => sum + m.tokens, 0);
      setTokenCount(tokens);
    }
  }, [characterId]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      setLoading(true);

      try {
        // Fetch existing conversation
        let conversation = await db.conversations
          .where("characterId")
          .equals(characterId)
          .last();

        // Create if doesn't exist
        if (!conversation) {
          const convId = await db.conversations.add({
            id: `${characterId}_${Date.now()}`,
            characterId,
            messages: [],
            summaries: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            totalMessages: 0,
          });
          conversation = (await db.conversations.get(convId))!;
        }

        // Build API message list with smart context
        const apiMessages: any[] = [
          {
            role: "system",
            content: character.systemPrompt,
          },
        ];

        // Add summaries of old conversations (token-efficient)
        if (conversation.summaries.length > 0) {
          const recentSummaries = conversation.summaries.slice(-3);
          const summaryContext = recentSummaries
            .map((s) => `[Earlier conversation]: ${s.summary}`)
            .join("\n");

          apiMessages.push({
            role: "system",
            content: summaryContext,
          });
        }

        // Add recent messages (keep last 5)
        const recentMessages = conversation.messages.slice(-5);
        apiMessages.push(...recentMessages);

        // Add new user message
        apiMessages.push({
          role: "user",
          content: userMessage,
        });

        // Get response from OpenRouter
        const response = await chatWithWaifu(apiMessages, character.name);

        // Estimate tokens (rough calculation)
        const userTokens = Math.ceil(userMessage.length / 4);
        const responseTokens = Math.ceil(response.length / 4);

        // Save to IndexedDB
        const newMessages = [
          ...conversation.messages,
          {
            role: "user" as const,
            content: userMessage,
            timestamp: Date.now(),
            tokens: userTokens,
          },
          {
            role: "assistant" as const,
            content: response,
            timestamp: Date.now(),
            tokens: responseTokens,
          },
        ];

        conversation.messages = newMessages;
        conversation.totalMessages = newMessages.length;
        conversation.updatedAt = Date.now();

        await db.conversations.update(conversation.id!, {
          messages: newMessages,
          totalMessages: newMessages.length,
          updatedAt: Date.now(),
        });

        setMessages(newMessages);
        setTokenCount((prev) => prev + userTokens + responseTokens);

        // Check if need to summarize
        checkAndSummarize(conversation.id!, 15);
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setLoading(false);
      }
    },
    [characterId, character]
  );

  return {
    messages,
    sendMessage,
    loading,
    tokenCount,
    loadConversation,
  };
}
```

---

## 📊 Token Estimation & Budget

### How OpenRouter Counts Tokens

```
Free tier limit: ~100K tokens/month (estimated)

Per message request:
- System prompt: ~250 tokens
- Character context: ~100 tokens
- Recent 5 messages: ~300 tokens
- User input: ~50 tokens
- Max response: 150 tokens
─────────────────────────
Total: ~850 tokens per exchange

BUT with summarization:
- System prompt: ~250 tokens
- Summary of old: ~100 tokens
- Recent 3 messages: ~150 tokens
- User input: ~50 tokens
- Max response: 150 tokens
─────────────────────────
Total: ~700 tokens per exchange

Monthly budget:
100,000 tokens ÷ 700 tokens = ~143 exchanges
= ~5 exchanges/day per user (reasonable!)

If you want more:
- Reduce response length (max_tokens: 100)
- More aggressive summarization (every 10 messages)
- Compress character profile (JSON format)
```

### Monitoring Script

```typescript
// utils/tokenMonitor.ts
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  // More accurate: use OpenRouter's tokenizer
  return Math.ceil(text.length / 4);
}

export function trackApiUsage(
  systemPromptTokens: number,
  inputTokens: number,
  outputTokens: number
) {
  const totalUsed = systemPromptTokens + inputTokens + outputTokens;

  // Store to localStorage for analytics
  const usage = JSON.parse(localStorage.getItem("tokenUsage") || "{}");
  const today = new Date().toISOString().split("T")[0];

  usage[today] = (usage[today] || 0) + totalUsed;

  localStorage.setItem("tokenUsage", JSON.stringify(usage));

  // Warn if approaching limit
  const monthlyTotal = Object.values(usage).reduce(
    (sum, n) => sum + (n as number),
    0
  );

  if (monthlyTotal > 80000) {
    console.warn(`⚠️ Token usage high: ${monthlyTotal}/100K`);
  }
}
```

---

## 🚀 Quick Start Checklist

- [ ] Create OpenRouter account
- [ ] Generate API key
- [ ] Set up environment variables
- [ ] Install dependencies: `npm install dexie axios zod`
- [ ] Create character profiles
- [ ] Implement chat hook
- [ ] Set up IndexedDB
- [ ] Test summarization
- [ ] Deploy to Vercel

---

## 🔗 Useful Links

- OpenRouter Models: https://openrouter.io/models
- Llama 3.1 Specs: https://www.llama.com/
- Dexie.js Docs: https://dexie.org/
- Token Counter: https://js.anthropic.com/

---

**Last Updated**: May 2026  
**Recommended Model**: Llama 3.1 8B Instruct (Free)  
**Estimated Cost**: $0/month ✅
