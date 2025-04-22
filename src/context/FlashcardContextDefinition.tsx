import { createContext, useContext } from "react";
import { FlashcardDeck } from "@/types/flashcard";

// Define the shape of the context
interface FlashcardContextType {
  activeDeck: FlashcardDeck | null;
  setActiveDeck: (deck: FlashcardDeck | null) => void;
  savedDecks: FlashcardDeck[];
  setSavedDecks: (decks: FlashcardDeck[]) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  deleteFlashcardDeck: (deckId: string) => void;
  saveFlashcardDeck: (deck: Omit<FlashcardDeck, 'id' | 'dateCreated' | 'lastModified'> & { id?: string }) => void;
  loadDeck: (deckId: string) => FlashcardDeck | null;
  handleCreateNewDeck: () => void;
}

// Create context with default values
export const FlashcardContext = createContext<FlashcardContextType>({
  activeDeck: null,
  setActiveDeck: () => {},
  savedDecks: [],
  setSavedDecks: () => {},
  isGenerating: false,
  setIsGenerating: () => {},
  deleteFlashcardDeck: () => {},
  saveFlashcardDeck: () => {},
  loadDeck: () => null,
  handleCreateNewDeck: () => {}
});

// Custom hook to use the context
export const useFlashcard = () => useContext(FlashcardContext);

// Export the storage key as a constant
export const FLASHCARD_STORAGE_KEY = 'flashcard-decks';