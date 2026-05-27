import { useEffect, useCallback } from "react";
import { useAppStore } from "./store/appStore";
import { useWaifuChat } from "./hooks/useWaifuChat";
import CharacterSelect from "./components/CharacterSelect";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const characters = useAppStore((s) => s.characters);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const selectedCharacterId = useAppStore((s) => s.selectedCharacterId);
  const setSelectedCharacter = useAppStore((s) => s.setSelectedCharacter);
  const loadCharacters = useAppStore((s) => s.loadCharacters);
  const resetCharacter = useAppStore((s) => s.resetCharacter);
  const character = useAppStore((s) => s.getSelectedCharacter());

  const onReload = useCallback(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const {
    messages,
    sendMessage,
    retrySend,
    loading: chatLoading,
    error: chatError,
    errorType: chatErrorType,
    conversationId,
    clearConversation,
  } = useWaifuChat(selectedCharacterId, character);

  if (!character) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <CharacterSelect
          characters={characters}
          loading={loading}
          error={error}
          onSelectCharacter={setSelectedCharacter}
          onReload={onReload}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <ChatWindow
        character={character}
        messages={messages}
        loading={chatLoading}
        error={chatError}
        errorType={chatErrorType}
        conversationId={conversationId}
        onSendMessage={sendMessage}
        onRetry={retrySend}
        onBack={resetCharacter}
        onClearConversation={clearConversation}
      />
    </div>
  );
}
