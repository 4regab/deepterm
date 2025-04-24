import React, { useState, useEffect, useCallback } from "react";
import { FlashcardDeck } from "@/types/flashcard";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { FlashcardContext, FLASHCARD_STORAGE_KEY } from "./FlashcardContextDefinition";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Import the hook

// Define a constant for storing the active deck ID
const ACTIVE_DECK_ID_KEY = 'flashcard-active-deck-id';

// Provider component
export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use useLocalStorage for savedDecks persistence
  const [savedDecks, setSavedDecks] = useLocalStorage<FlashcardDeck[]>(FLASHCARD_STORAGE_KEY, []);
  
  // State for activeDeck and generation status (keep using useState)
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load active deck from local storage on initial render
  useEffect(() => {
    try {
      const activeDeckId = localStorage.getItem(ACTIVE_DECK_ID_KEY);
      if (activeDeckId) {
        // Find the deck from the already loaded savedDecks
        const activeD = savedDecks.find(d => d.id === activeDeckId);
        if (activeD) {
          setActiveDeck(activeD);
        } else {
          // If the active deck ID is invalid, remove it
          localStorage.removeItem(ACTIVE_DECK_ID_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load active flashcard deck ID:", error);
    }
    // Depend on savedDecks being loaded by the hook
  }, [savedDecks]);

  // Remove the useEffect hooks that manually loaded/saved savedDecks
  // The useLocalStorage hook handles this automatically.

  // Save active deck ID to local storage whenever it changes
  useEffect(() => {
    try {
      if (activeDeck) {
        localStorage.setItem(ACTIVE_DECK_ID_KEY, activeDeck.id);
      } else {
        localStorage.removeItem(ACTIVE_DECK_ID_KEY);
      }
    } catch (error) {
      console.error("Failed to save active deck ID to local storage:", error);
    }
  }, [activeDeck]);

  // Function to save or update a deck (adapts to useLocalStorage setter)
  const saveFlashcardDeck = useCallback((deckData: Omit<FlashcardDeck, 'id' | 'dateCreated'> & { id?: string }) => {
    const now = new Date().toISOString();
    let updatedDeck: FlashcardDeck | null = null;
    
    // Direct assignment instead of updater function
    const prevDecks = [...savedDecks]; // Create a copy of current state
    
    if (deckData.id) {
      // Update existing deck
      const index = prevDecks.findIndex(d => d.id === deckData.id);
      if (index !== -1) {
        updatedDeck = { 
          ...prevDecks[index], 
          ...deckData, 
          lastModified: now 
        };
        prevDecks[index] = updatedDeck;
        toast.success(`Deck "${deckData.title}" updated.`);
      }
    } else {
      // Add new deck
      updatedDeck = {
        ...deckData,
        id: deckData.id || uuidv4(),
        dateCreated: now,
        lastModified: now,
        cards: deckData.cards || []
      };
      prevDecks.push(updatedDeck);
      toast.success(`Deck "${updatedDeck.title}" saved.`);
    }
    
    // Set the entire new array
    setSavedDecks(prevDecks);

    // If this was the active deck being updated, update the activeDeck state
    if (updatedDeck && activeDeck && activeDeck.id === updatedDeck.id) {
      setActiveDeck(updatedDeck);
    }
  }, [activeDeck, savedDecks, setSavedDecks]);

  // Function to delete a deck (adapts to useLocalStorage setter)
  const deleteFlashcardDeck = useCallback((deckId: string) => {
    // Direct manipulation instead of updater function
    const prevDecks = [...savedDecks];
    const deckToDelete = prevDecks.find(d => d.id === deckId);
    
    if (deckToDelete) {
      // Filter out the deck to delete
      const updatedDecks = prevDecks.filter(deck => deck.id !== deckId);
      setSavedDecks(updatedDecks);
      toast.success(`Deck "${deckToDelete.title}" deleted.`);
    }
    
    // If the active deck is the one being deleted, clear it
    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
    }
  }, [activeDeck, savedDecks, setSavedDecks]);

  // Function to load a specific deck by ID (uses savedDecks from the hook)
  const loadDeck = useCallback((deckId: string): FlashcardDeck | null => {
    const deck = savedDecks.find(d => d.id === deckId) || null;
    setActiveDeck(deck); // Set as active deck when loaded
    return deck;
  }, [savedDecks]); // Depends on savedDecks from the hook

  // Function for creating a new deck
  const handleCreateNewDeck = useCallback(() => {
    // Clear active deck to start fresh
    setActiveDeck(null);
  }, []);

  const value = {
    activeDeck,
    setActiveDeck,
    savedDecks,
    setSavedDecks,
    isGenerating,
    setIsGenerating,
    deleteFlashcardDeck,
    saveFlashcardDeck,
    loadDeck,
    handleCreateNewDeck,
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
};
