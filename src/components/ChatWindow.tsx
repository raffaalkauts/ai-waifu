import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Character, ChatMessage } from "../db/schema";
import type { WaifuErrorType } from "../hooks/useWaifuChat";
import {
  exportConversationAsJSON,
  exportConversationAsText,
  importConversation,
} from "../utils/export";
import ThemeToggle from "./ThemeToggle";
import ChatFooter from "./ChatFooter";

/* ── Props ──────────────────────────────────────────────── */

interface ChatWindowProps {
  character: Character;
  messages: ChatMessage[];
  loading: boolean;
  error?: string | null;
  errorType?: WaifuErrorType;
  conversationId?: string | null;
  onSendMessage: (message: string) => void;
  onRetry?: () => void;
  onBack?: () => void;
  onClearConversation?: () => void;
}

/* ── Scrolling assistant ─────────────────────────────────── */

function useAutoScroll(deps: unknown[]) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return bottomRef;
}

/* ── Skeleton loader ─────────────────────────────────────── */

function MessageSkeleton() {
  return (
    <div className="flex items-end gap-2 px-3 py-1 sm:gap-3 sm:px-4">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800 sm:h-9 sm:w-9" />
      <div className="animate-pulse space-y-2 rounded-2xl bg-gray-100 px-3 py-2.5 dark:bg-gray-800/50 sm:px-4 sm:py-3">
        <div className="h-3 w-36 rounded bg-gray-300 dark:bg-gray-700 sm:w-48" />
        <div className="h-3 w-28 rounded bg-gray-300 dark:bg-gray-700 sm:w-36" />
      </div>
    </div>
  );
}

/* ── Typing indicator ────────────────────────────────────── */

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2 px-3 py-1 animate-fade-in sm:gap-3 sm:px-4">
      <span className="avatar-ring text-lg">{""}</span>
      <div className="chat-bubble-assistant flex items-center gap-1.5 py-3">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="ml-1.5 text-xs text-gray-500">{name} is thinking</span>
      </div>
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────── */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex items-end gap-2 px-3 py-1 animate-slide-up sm:gap-3 sm:px-4 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <span
        className={isUser ? "avatar-ring-user shrink-0" : "avatar-ring shrink-0"}
      >
        {isUser ? "You" : ""}
      </span>

      <div
        className={
          isUser
            ? "chat-bubble-user max-w-[80%] sm:max-w-[70%]"
            : isAssistant
              ? "chat-bubble-assistant max-w-[85%] sm:max-w-[75%]"
              : "chat-bubble-system"
        }
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-base">
          {message.content}
        </p>
      </div>
    </div>
  );
}

/* ── Error banner ────────────────────────────────────────── */

function ErrorBanner({
  message,
  type,
  onRetry,
  onDismiss,
}: {
  message: string;
  type?: WaifuErrorType;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  const colors =
    type === "network"
      ? "border-amber-500/30 bg-amber-950/40 text-amber-300"
      : type === "db"
        ? "border-orange-500/30 bg-orange-950/40 text-orange-300"
        : "border-red-500/30 bg-red-950/40 text-red-300";

  return (
    <div
      className={`mx-3 mb-2 flex items-start gap-3 rounded-xl border p-3 animate-slide-up sm:mx-4 sm:p-4 ${colors}`}
    >
      <span className="mt-0.5 shrink-0 text-lg">
        {type === "network" ? "🌐" : type === "db" ? "💾" : "⚠️"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                clipRule="evenodd"
              />
            </svg>
            Retry
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-current/60 transition-colors hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

/* ── Header menu ──────────────────────────────────────────── */

function HeaderMenu({
  conversationId,
  onClear,
  hasMessages,
}: {
  conversationId?: string | null;
  onClear?: () => void;
  hasMessages: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleExportJSON() {
    if (!conversationId) return;
    setOpen(false);
    try {
      await exportConversationAsJSON(conversationId);
    } catch {
      setStatus("Export failed");
      setTimeout(() => setStatus(null), 3000);
    }
  }

  async function handleExportText() {
    if (!conversationId) return;
    setOpen(false);
    try {
      await exportConversationAsText(conversationId);
    } catch {
      setStatus("Export failed");
      setTimeout(() => setStatus(null), 3000);
    }
  }

  function handleClear() {
    setOpen(false);
    onClear?.();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const result = await importConversation(file);
    setImporting(false);
    if (result.success) {
      setStatus("Imported! Switch characters to reload");
    } else {
      setStatus(result.error ?? "Import failed");
    }
    setTimeout(() => setStatus(null), 4000);
    e.target.value = "";
  }

  const disabled = !hasMessages && !conversationId;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white sm:h-10 sm:w-10"
        aria-label="Menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 origin-top-right animate-slide-up overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50">
          <button
            onClick={handleExportJSON}
            disabled={disabled}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Export as JSON
          </button>

          <button
            onClick={handleExportText}
            disabled={disabled}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Export as Text
          </button>

          <div className="my-1 border-t border-gray-200 dark:border-gray-800" />

          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636V13.25Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            {importing ? "Importing..." : "Import"}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          <button
            onClick={handleClear}
            disabled={disabled}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.019-1.584.048-2.37.084a.75.75 0 0 0 .062 1.497l.364-.017.454 12.118A2.75 2.75 0 0 0 7.25 20h5.5a2.75 2.75 0 0 0 2.74-2.645l.455-12.118.363.017a.75.75 0 0 0 .062-1.497c-.786-.036-1.575-.065-2.37-.084V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM8.5 4.25V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.5c-.733.006-1.467.023-2.2.04a79.819 79.819 0 0 1-2.8 0ZM7.197 5.858a.75.75 0 0 1 .81.637l.868 6.687a.75.75 0 0 1-1.488.193l-.87-6.687a.75.75 0 0 1 .68-.83Zm5.606 0a.75.75 0 0 1 .68.83l-.87 6.687a.75.75 0 0 1-1.488-.193l.869-6.687a.75.75 0 0 1 .809-.637Z"
                clipRule="evenodd"
              />
            </svg>
            Clear conversation
          </button>
        </div>
      )}

      {/* Status toast */}
      {status && (
        <div className="absolute right-0 top-full mt-12 z-50 animate-slide-up whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {status}
        </div>
      )}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */

export default function ChatWindow({
  character,
  messages,
  loading,
  error,
  errorType,
  conversationId,
  onSendMessage,
  onRetry,
  onBack,
  onClearConversation,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useAutoScroll([messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [character.id]);

  const showError = error && error !== dismissedError;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onSendMessage(text);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white/80 px-2 py-3 backdrop-blur-sm dark:border-gray-800/60 dark:bg-gray-900/50 sm:gap-3 sm:px-5 sm:py-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white sm:h-10 sm:w-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-waifu-500/10 text-xl ring-2 ring-waifu-500/20 sm:h-12 sm:w-12 sm:text-2xl">
          {character.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            {character.name}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            {character.description}
          </p>
        </div>

        <ThemeToggle />
        <HeaderMenu
          conversationId={conversationId}
          onClear={onClearConversation}
          hasMessages={messages.length > 0}
        />
      </header>

      {/* ── Messages ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hidden sm:py-4">
        {/* Empty state */}
        {messages.length === 0 && !loading && !showError && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center animate-fade-in sm:px-6">
            <span className="text-5xl sm:text-6xl">{character.avatar}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                {character.name}
              </h2>
              <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                {character.description} — start a conversation!
              </p>
            </div>
          </div>
        )}

        {/* Skeleton while loading with no messages yet */}
        {messages.length === 0 && loading && (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && messages.length > 0 && (
          <TypingIndicator name={character.name} />
        )}

        {/* Error banner */}
        {showError && (
          <ErrorBanner
            message={error}
            type={errorType}
            onRetry={onRetry}
            onDismiss={() => setDismissedError(error)}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-gray-200 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-gray-800/60 dark:bg-gray-900/50 sm:gap-3 sm:px-5 sm:py-4"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              loading
                ? `${character.name} is typing...`
                : `Chat with ${character.name}...`
            }
            disabled={loading}
            className="chat-input pr-12"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-waifu-600 text-white transition-all duration-200 hover:bg-waifu-500 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>

      <ChatFooter inputText={input} />
    </div>
  );
}
