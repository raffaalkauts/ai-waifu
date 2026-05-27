import axios from "axios";
import { trackTokenUsage } from "../utils/tokenTracking";

/* ── Constants ──────────────────────────────────────────── */

const MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

/* Use Vite proxy in dev to avoid CORS */
const BASE = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_OPENROUTER_BASE_URL;

const api = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    "HTTP-Referer": import.meta.env.VITE_APP_URL || "http://localhost:3000",
  },
  timeout: 30_000,
});

/* ── Types ──────────────────────────────────────────────── */

export interface OpenRouterRequest {
  model: string;
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatResult {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/* ── Errors ─────────────────────────────────────────────── */

class OpenRouterError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

/* ── Chat ───────────────────────────────────────────────── */

export async function chatWithWaifu(
  messages: { role: string; content: string }[],
  characterName?: string,
): Promise<ChatResult> {
  const payload: OpenRouterRequest = {
    model: MODEL,
    messages,
    max_tokens: 150,
    temperature: 0.8,
    top_p: 0.95,
  };

  try {
    const { data } = await api.post<OpenRouterResponse>(
      "/chat/completions",
      payload,
    );

    const name = characterName || "waifu";
    console.log(
      `[openrouter] ${name} — tokens: ${data.usage.total_tokens} ` +
        `(prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`,
    );

    return {
      content: data.choices[0].message.content,
      tokens: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const detail =
        error.response?.data?.error?.message ||
        error.response?.data?.error ||
        error.message;

      if (status === 401) {
        throw new OpenRouterError(
          "Invalid OpenRouter API key. Check VITE_OPENROUTER_API_KEY in .env.local.",
          status,
        );
      }
      if (status === 402) {
        throw new OpenRouterError(
          "OpenRouter account has insufficient credits. Add funds at openrouter.ai/activity.",
          status,
        );
      }
      if (status === 429) {
        throw new OpenRouterError(
          "Rate limited by OpenRouter. Waiting before retry.",
          status,
        );
      }

      throw new OpenRouterError(
        `OpenRouter API error (${status}): ${detail}`,
        status,
      );
    }

    throw new OpenRouterError(
      error instanceof Error ? error.message : "Unknown network error",
      0,
    );
  }
}

/* ── Token helpers ──────────────────────────────────────── */

const TOKEN_RATIO = 4;

export function estimateTokens(text: string): number {
  // roughly 1 token per 4 characters for English text
  return Math.ceil(text.length / TOKEN_RATIO);
}

export { trackTokenUsage } from "../utils/tokenTracking";
