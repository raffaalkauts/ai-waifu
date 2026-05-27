import { useAppStore } from "../store/appStore";
import type { Character } from "../db/schema";

export function useCharacters() {
  const characters = useAppStore((s) => s.characters);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const loadCharacters = useAppStore((s) => s.loadCharacters);
  const selectCharacter = useAppStore((s) => s.setSelectedCharacter);

  return { characters, loading, error, loadCharacters, selectCharacter };
}

export function useCharacterProfile(
  characterId: string | null,
): Character | null {
  const characters = useAppStore((s) => s.characters);
  if (!characterId) return null;
  return characters.find((c) => c.id === characterId) ?? null;
}

export { useAppStore as useCharacterContext };
