export type {
  ChatMessage as Message,
  ConversationSummary,
  Conversation,
  Character,
} from "../db/schema";

export interface ChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
