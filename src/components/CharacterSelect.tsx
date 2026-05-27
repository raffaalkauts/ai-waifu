import { useState } from "react";
import type { Character } from "../db/schema";
import ThemeToggle from "./ThemeToggle";
import TokenStatus from "./TokenStatus";
import CharacterForm from "./CharacterForm";

/* ── Props ──────────────────────────────────────────────── */

interface CharacterSelectProps {
  characters: Character[];
  loading?: boolean;
  error?: string | null;
  onSelectCharacter: (characterId: string) => void;
  onReload?: () => void;
}

/* ── Skeleton card ───────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-5 dark:border-gray-800 dark:bg-gray-900/50 sm:gap-4 sm:p-7">
      <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-800 sm:h-16 sm:w-16" />
      <div className="space-y-2 text-center">
        <div className="mx-auto h-5 w-20 rounded bg-gray-200 dark:bg-gray-800 sm:w-24" />
        <div className="mx-auto h-3 w-14 rounded bg-gray-200 dark:bg-gray-800 sm:w-16" />
        <div className="mx-auto h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 sm:w-40" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-800 sm:w-14" />
        <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-800 sm:w-14" />
      </div>
      <div className="mt-1 h-9 w-24 rounded-xl bg-gray-200 dark:bg-gray-800 sm:mt-2 sm:w-28" />
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────── */

function CharacterCard({
  character,
  onSelect,
}: {
  character: Character;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white/50 p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:border-waifu-300 hover:bg-gray-50 hover:shadow-xl hover:shadow-waifu-500/5 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-waifu-500/40 dark:hover:bg-gray-800/50 dark:hover:shadow-waifu-500/5 sm:gap-4 sm:p-7"
    >
      <span className="text-4xl transition-transform duration-300 group-hover:scale-110 sm:text-5xl">
        {character.avatar}
      </span>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          {character.name}
        </h3>
        <p className="text-[11px] capitalize text-gray-500 dark:text-gray-400 sm:text-xs">
          {character.personality}
        </p>
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-500 sm:text-sm">
          {character.description}
        </p>
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {character.interests.slice(0, 3).map((interest) => (
          <span
            key={interest}
            className="rounded-full bg-waifu-100 px-2 py-0.5 text-[10px] text-waifu-700 dark:bg-waifu-500/10 dark:text-waifu-400 sm:px-2.5 sm:text-[11px]"
          >
            {interest}
          </span>
        ))}
      </div>

      <span className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-waifu-600 px-4 py-1.5 text-xs font-medium text-white transition-all duration-200 group-hover:bg-waifu-500 group-hover:shadow-lg group-hover:shadow-waifu-500/20 sm:mt-2 sm:px-5 sm:py-2 sm:text-sm">
        Chat now
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
        </svg>
      </span>
    </button>
  );
}

/* ── Create card ──────────────────────────────────────────── */

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white/30 p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:border-waifu-400 hover:bg-waifu-50/50 dark:border-gray-700 dark:bg-gray-900/20 dark:hover:border-waifu-500/50 dark:hover:bg-waifu-500/5 sm:gap-3 sm:p-7"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400 transition-transform duration-300 group-hover:scale-110 group-hover:bg-waifu-100 group-hover:text-waifu-500 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-waifu-500/20 dark:group-hover:text-waifu-400 sm:h-16 sm:w-16 sm:text-3xl">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
          <path d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H5.25a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" />
        </svg>
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          Create Character
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          Build your own waifu
        </p>
      </div>
    </button>
  );
}

/* ── Component ───────────────────────────────────────────── */

export default function CharacterSelect({
  characters,
  loading,
  error,
  onSelectCharacter,
  onReload,
}: CharacterSelectProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50 px-4 py-10 scrollbar-hidden dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 sm:gap-10 sm:px-6 sm:py-12">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="relative w-full max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gradient sm:text-4xl md:text-5xl">
              AI Waifu Chat
            </h1>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 sm:mt-3 sm:text-sm">
              {error
                ? "Could not load characters"
                : "Choose a character to chat with"}
            </p>
          </div>
          <div className="absolute right-0 top-0 hidden sm:block">
            <ThemeToggle />
          </div>
        </div>

        {/* ── Error state ──────────────────────────────────── */}
        {error && (
          <div className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-6 py-5 text-center animate-fade-in sm:px-8 sm:py-6">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-red-300">{error}</p>
            {onReload && (
              <button
                onClick={onReload}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600/20 px-5 py-2 text-sm font-medium text-red-300 transition-all duration-200 hover:bg-red-600/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                    clipRule="evenodd"
                  />
                </svg>
                Try again
              </button>
            )}
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────────── */}
        {loading && (
          <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* ── Character grid + create card ────────────────── */}
        {!loading && !error && (
          <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onSelect={() => onSelectCharacter(character.id)}
              />
            ))}
            <CreateCard onClick={() => setShowForm(true)} />
          </div>
        )}

        {/* ── Token budget ──────────────────────────────────── */}
        {!loading && !error && characters.length > 0 && (
          <div className="flex w-full max-w-xs justify-center">
            <TokenStatus />
          </div>
        )}

        {/* ── Mobile FAB ──────────────────────────────────── */}
        {!loading && !error && (
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-waifu-600 text-white shadow-lg shadow-waifu-500/30 transition-all duration-200 hover:bg-waifu-500 hover:shadow-xl hover:shadow-waifu-500/40 active:scale-95 sm:hidden"
            aria-label="Create character"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H5.25a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Character form modal ──────────────────────────── */}
      {showForm && <CharacterForm onClose={() => setShowForm(false)} />}
    </>
  );
}
