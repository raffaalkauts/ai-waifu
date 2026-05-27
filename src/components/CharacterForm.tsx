import { useState, useRef } from "react";
import type { Character } from "../db/schema";
import { saveCharacter } from "../db";
import { useAppStore } from "../store/appStore";

/* ── Props ──────────────────────────────────────────────── */

interface CharacterFormProps {
  onClose: () => void;
}

/* ── Avatar options ─────────────────────────────────────── */

const AVATARS = [
  "👱‍♀️", "🧊", "🌸", "💜", "🦋", "🌙", "⭐", "🎀",
  "👑", "🌺", "🍀", "🌈", "💫", "✨", "🌷", "🕊️",
  "🍭", "🎮", "📚", "🎵", "🌊", "🔥", "🍃", "❄️",
];

const PERSONALITIES = [
  { value: "tsundere", label: "Tsundere", description: "Tough outside, soft inside" },
  { value: "kuudere", label: "Kuudere", description: "Cool, calm, collected" },
  { value: "yandere", label: "Yandere", description: "Sweet turns intense" },
  { value: "deredere", label: "Deredere", description: "Warm, loving, affectionate" },
] as const;

/* ── Helpers ────────────────────────────────────────────── */

function generateId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return `char-${slug || "custom"}-${suffix}`;
}

/* ── Component ───────────────────────────────────────────── */

export default function CharacterForm({ onClose }: CharacterFormProps) {
  const addCharacter = useAppStore((s) => s.addCharacter);
  const setSelectedCharacter = useAppStore((s) => s.setSelectedCharacter);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [personality, setPersonality] = useState("");
  const [description, setDescription] = useState("");
  const [speechStyle, setSpeechStyle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interestRef = useRef<HTMLInputElement>(null);

  function addInterest() {
    const val = interestInput.trim();
    if (val && !interests.includes(val)) {
      setInterests([...interests, val]);
      setInterestInput("");
    }
    interestRef.current?.focus();
  }

  function removeInterest(i: number) {
    setInterests(interests.filter((_, idx) => idx !== i));
  }

  function handleInterestKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Name is required"); return; }
    if (!avatar) { setError("Pick an avatar"); return; }
    if (!personality) { setError("Pick a personality type"); return; }
    if (!systemPrompt.trim()) { setError("System prompt is required"); return; }

    setSaving(true);

    const character: Character = {
      id: generateId(name),
      name: name.trim(),
      description: description.trim() || `A ${personality} character`,
      avatar,
      personality,
      speechStyle: speechStyle.trim() || `${personality} style`,
      interests: interests.length > 0 ? interests : ["general"],
      systemPrompt: systemPrompt.trim(),
    };

    try {
      await saveCharacter(character);
      addCharacter(character);
      setSelectedCharacter(character.id);
    } catch {
      setError("Failed to save character. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-waifu-500 focus:ring-2 focus:ring-waifu-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";

  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-slide-up">
        {/* ── Header ────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Character
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <form
          id="character-form"
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto px-6 py-5 scrollbar-hidden"
        >
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="char-name" className={labelClass}>Name *</label>
            <input
              id="char-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayumi"
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Avatar */}
          <div>
            <span className={labelClass}>Avatar *</span>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all duration-200 ${
                    avatar === emoji
                      ? "scale-110 bg-waifu-100 ring-2 ring-waifu-500 dark:bg-waifu-500/20 dark:ring-waifu-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <span className={labelClass}>Personality *</span>
            <div className="grid grid-cols-2 gap-2">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPersonality(p.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                    personality === p.value
                      ? "border-waifu-500 bg-waifu-50 dark:border-waifu-400 dark:bg-waifu-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{p.label}</span>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="char-desc" className={labelClass}>Description</label>
            <input
              id="char-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A mysterious girl who loves the rain"
              className={inputClass}
            />
          </div>

          {/* Speech Style */}
          <div>
            <label htmlFor="char-speech" className={labelClass}>Speech Style</label>
            <input
              id="char-speech"
              type="text"
              value={speechStyle}
              onChange={(e) => setSpeechStyle(e.target.value)}
              placeholder="e.g. soft and poetic"
              className={inputClass}
            />
          </div>

          {/* Interests */}
          <div>
            <label htmlFor="char-interests" className={labelClass}>Interests</label>
            <div className="flex gap-2">
              <input
                ref={interestRef}
                id="char-interests"
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={handleInterestKey}
                placeholder="Type and press Enter"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addInterest}
                disabled={!interestInput.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-waifu-600 px-3 py-2.5 text-sm text-white transition-all hover:bg-waifu-500 disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Add
              </button>
            </div>
            {interests.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {interests.map((interest, i) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 rounded-full bg-waifu-100 px-2.5 py-1 text-xs text-waifu-700 dark:bg-waifu-500/10 dark:text-waifu-400"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(i)}
                      className="ml-0.5 inline-flex hover:text-waifu-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="char-prompt" className={labelClass}>System Prompt *</label>
            <textarea
              id="char-prompt"
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe how the character should behave, what catchphrases they use, and how they respond. Markdown is supported."
              className={`${inputClass} resize-y min-h-[120px]`}
            />
          </div>
        </form>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="character-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-waifu-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-waifu-500 disabled:opacity-40"
          >
            {saving ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Create Character
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
