import TokenStatus from "./TokenStatus";

/* ── Props ──────────────────────────────────────────────── */

interface ChatFooterProps {
  inputText: string;
}

/* ── Token estimate ─────────────────────────────────────── */

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/* ── Component ───────────────────────────────────────────── */

export default function ChatFooter({ inputText }: ChatFooterProps) {
  const estimated = inputText.trim() ? estimateTokens(inputText) : 0;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-100/50 px-3 py-2 dark:border-gray-800/40 dark:bg-gray-900/30 sm:px-5">
      {/* Token count for current message */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-600">
        {estimated > 0 && (
          <span>
            ~{estimated} token{estimated !== 1 ? "s" : ""}
          </span>
        )}
        {estimated > 0 && estimated > 100 && (
          <span className="text-amber-600/80">(long message)</span>
        )}
      </div>

      {/* Budget status */}
      <TokenStatus />
    </div>
  );
}
