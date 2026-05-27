import { useState, useEffect } from "react";
import { getTokenBudgetStatus } from "../utils/tokenTracking";

/* ── Days remaining in month ─────────────────────────────── */

function daysRemainingInMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return endOfMonth.getDate() - now.getDate();
}

/* ── Component ───────────────────────────────────────────── */

export default function TokenStatus() {
  const [budget, setBudget] = useState(getTokenBudgetStatus);

  useEffect(() => {
    const interval = setInterval(() => {
      setBudget(getTokenBudgetStatus());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isWarning = budget.used > 80_000;

  const barColor =
    budget.percentage >= 100
      ? "bg-red-500"
      : budget.percentage >= 80
        ? "bg-amber-500"
        : "bg-waifu-500";

  return (
    <>
      {/* ── Compact (mobile) ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-gray-500 sm:hidden">
        <span className="tabular-nums">{budget.used.toLocaleString()}</span>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </span>
        <span className="tabular-nums">{budget.limit.toLocaleString()}</span>
        {isWarning && <span className="text-amber-500 dark:text-amber-400">⚠</span>}
      </div>

      {/* ── Full (tablet+) ───────────────────────────────── */}
      <div className="hidden w-full max-w-xs space-y-2 text-xs text-gray-500 dark:text-gray-400 sm:block">
        <div className="flex items-center justify-between">
          <span>Monthly tokens</span>
          <span
            className={
              isWarning
                ? "font-medium text-amber-500 dark:text-amber-400"
                : "tabular-nums"
            }
          >
            {budget.percentage}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="tabular-nums">
            {budget.used.toLocaleString()} / {budget.limit.toLocaleString()}
          </span>
          <span className="tabular-nums">
            {budget.remaining.toLocaleString()} remaining
            {daysRemainingInMonth() > 0 && ` · ${daysRemainingInMonth()}d left`}
          </span>
        </div>

        {isWarning && (
          <p className="text-amber-500 dark:text-amber-400">⚠ Over 80K tokens used this month</p>
        )}
      </div>
    </>
  );
}
