import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Character } from "../db/schema";
import { loadCharacters as loadFromDb, saveCharacter } from "../db";
import { DEFAULT_CHARACTERS } from "../data/characters";

/* ── State ──────────────────────────────────────────────── */

interface AppState {
  selectedCharacterId: string | null;
  characters: Character[];
  currentScreen: "select" | "chat";
  loading: boolean;
  error: string | null;

  /* Actions */
  setSelectedCharacter: (id: string) => void;
  selectScreen: (screen: "select" | "chat") => void;
  loadCharacters: () => Promise<void>;
  getSelectedCharacter: () => Character | null;
  resetCharacter: () => void;
  addCharacter: (character: Character) => void;
}

/* ── Store ──────────────────────────────────────────────── */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedCharacterId: null,
      characters: [],
      currentScreen: "select",
      loading: false,
      error: null,

      setSelectedCharacter: (id: string) => {
        set({ selectedCharacterId: id, currentScreen: "chat" });
      },

      selectScreen: (screen) => {
        set({ currentScreen: screen });
        if (screen === "select") {
          set({ selectedCharacterId: null });
        }
      },

      loadCharacters: async () => {
        set({ loading: true, error: null });
        try {
          const stored = await loadFromDb();
          if (stored.length > 0) {
            set({ characters: stored });
          } else {
            for (const char of DEFAULT_CHARACTERS) {
              await saveCharacter(char);
            }
            set({ characters: DEFAULT_CHARACTERS });
          }
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to load characters";
          console.error("[store]", msg);
          set({ error: msg });
        } finally {
          set({ loading: false });
        }
      },

      getSelectedCharacter: () => {
        const { characters, selectedCharacterId } = get();
        if (!selectedCharacterId) return null;
        return characters.find((c) => c.id === selectedCharacterId) ?? null;
      },

      resetCharacter: () => {
        set({ selectedCharacterId: null, currentScreen: "select" });
      },

      addCharacter: (character) => {
        set((state) => ({ characters: [...state.characters, character] }));
      },
    }),
    {
      name: "ai-waifu-app-store",
      partialize: (state) => ({
        selectedCharacterId: state.selectedCharacterId,
        currentScreen: state.currentScreen,
      }),
    },
  ),
);
