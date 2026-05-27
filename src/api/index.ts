import axios from "axios";
import type { ChatRequest, ChatResponse } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/v1/chat/completions", request);
  return data;
}

export async function sendChatStream(
  request: ChatRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await api.post("/v1/chat/completions", request, {
    responseType: "stream",
    signal,
  });

  const reader = response.data?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload);
        const text = parsed.choices?.[0]?.delta?.content || "";
        if (text) onChunk(text);
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export default api;
