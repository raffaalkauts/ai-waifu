/* ── Constants ──────────────────────────────────────────── */

const STORAGE_KEY = "ai-waifu-token-usage";
const DAILY_WARN_THRESHOLD = 80_000;
const MONTHLY_LIMIT = 100_000;

type DayRecord = {
  total: number;
  perCharacter: Record<string, number>;
};

type UsageStore = Record<string, DayRecord>;

/* ── Storage helpers ────────────────────────────────────── */

function load(): UsageStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(records: UsageStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage may be full or disabled
  }
}

/* ── Track ──────────────────────────────────────────────── */

export function trackTokenUsage(
  totalTokens: number,
  characterName: string,
): void {
  const records = load();
  const today = new Date().toISOString().slice(0, 10);

  if (!records[today]) {
    records[today] = { total: 0, perCharacter: {} };
  }

  records[today].total += totalTokens;

  if (!records[today].perCharacter[characterName]) {
    records[today].perCharacter[characterName] = 0;
  }
  records[today].perCharacter[characterName] += totalTokens;

  save(records);

  // ── Daily total ──
  const daily = records[today].total;
  console.log(
    `[tokens] Today: ${daily.toLocaleString()} tokens total ` +
      `(${records[today].perCharacter[characterName].toLocaleString()} from ${characterName})`,
  );

  // ── Monthly total ──
  const monthKey = today.slice(0, 7);
  const monthlyTotal = Object.entries(records)
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((sum, [, v]) => sum + v.total, 0);

  console.log(`[tokens] This month: ${monthlyTotal.toLocaleString()} / ${MONTHLY_LIMIT.toLocaleString()} tokens`);

  // ── Warning ──
  if (daily > DAILY_WARN_THRESHOLD) {
    console.warn(
      `[tokens] ⚠ Daily usage (${daily.toLocaleString()}) exceeds ${DAILY_WARN_THRESHOLD.toLocaleString()} token threshold.`,
    );
  }

  if (monthlyTotal > MONTHLY_LIMIT) {
    console.warn(
      `[tokens] ⚠ Monthly usage (${monthlyTotal.toLocaleString()}) exceeds the ${MONTHLY_LIMIT.toLocaleString()} token budget.`,
    );
  }
}

/* ── Budget status ──────────────────────────────────────── */

export function getTokenBudgetStatus(): {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning";
} {
  const records = load();
  const monthKey = new Date().toISOString().slice(0, 7);
  const used = Object.entries(records)
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((sum, [, v]) => sum + v.total, 0);

  return {
    used,
    limit: MONTHLY_LIMIT,
    remaining: Math.max(0, MONTHLY_LIMIT - used),
    percentage: Math.min(100, Math.round((used / MONTHLY_LIMIT) * 100)),
    status: used >= MONTHLY_LIMIT ? "warning" : "ok",
  };
}

/* ── Formatted report ───────────────────────────────────── */

export function getFormattedTokenUsage(): string {
  const records = load();
  const monthKey = new Date().toISOString().slice(0, 7);

  const days = Object.entries(records)
    .filter(([k]) => k.startsWith(monthKey))
    .sort(([a], [b]) => b.localeCompare(a));

  if (days.length === 0) return "No token usage recorded this month.";

  const lines = days.map(([date, record]) => {
    const label = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${label}: ${record.total.toLocaleString()} tokens`;
  });

  return lines.join(" | ");
}

/* ── Reset ──────────────────────────────────────────────── */

export function resetTokenUsage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[tokens] Token usage data cleared.");
  } catch {
    // localStorage may be disabled
  }
}
