import React, { useState, useEffect, useCallback } from "react";
import { FlashcardDeck } from "@/types/flashcard";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { FlashcardContext, FLASHCARD_STORAGE_KEY } from "./FlashcardContextDefinition";

// Define a constant for storing the active deck ID
const ACTIVE_DECK_ID_KEY = 'flashcard-active-deck-id';

// Provider component
export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load decks from local storage on initial render
  useEffect(() => {
    try {
      const storedDecks = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      if (storedDecks) {
        const parsedDecks: FlashcardDeck[] = JSON.parse(storedDecks);
        // Ensure dateCreated is a properly formatted string
        const validatedDecks = parsedDecks.map(deck => ({
          ...deck,
          dateCreated: deck.dateCreated || new Date().toISOString(),
          lastModified: deck.lastModified || new Date().toISOString()
        }));
        setSavedDecks(validatedDecks);
        
        // Try to restore the active deck
        const activeDeckId = localStorage.getItem(ACTIVE_DECK_ID_KEY);
        if (activeDeckId) {
          const activeD = validatedDecks.find(d => d.id === activeDeckId);
          if (activeD) {
            setActiveDeck(activeD);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load flashcard decks from local storage:", error);
      toast.error("Could not load your saved flashcard decks.");
    }
  }, []);

  // Save decks to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(savedDecks));
    } catch (error) {
      console.error("Failed to save flashcard decks to local storage:", error);
      toast.error("Could not save changes to your flashcard decks.");
    }
  }, [savedDecks]);
  
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

  // Function to save or update a deck
  const saveFlashcardDeck = useCallback((deckData: Omit<FlashcardDeck, 'id' | 'dateCreated'> & { id?: string }) => {
    setSavedDecks(prevDecks => {
      const now = new Date().toISOString();
      if (deckData.id) {
        // Update existing deck
        const index = prevDecks.findIndex(d => d.id === deckData.id);
        if (index !== -1) {
          const updatedDecks = [...prevDecks];
          updatedDecks[index] = { 
            ...prevDecks[index], 
            ...deckData, 
            lastModified: now 
          };
          toast.success(`Deck "${deckData.title}" updated.`);
          
          // If this is the active deck, update it too
          if (activeDeck && activeDeck.id === deckData.id) {
            setActiveDeck(updatedDecks[index]);
          }
          
          return updatedDecks;
        }
      }
      // Add new deck
      const newDeck: FlashcardDeck = {
        ...deckData,
        id: deckData.id || uuidv4(),
        dateCreated: now,
        lastModified: now,
        cards: deckData.cards || []
      };
      toast.success(`Deck "${newDeck.title}" saved.`);
      return [...prevDecks, newDeck];
    });
  }, [activeDeck]);

  // Function to delete a deck
  const deleteFlashcardDeck = useCallback((deckId: string) => {
    setSavedDecks(prevDecks => {
      const deckToDelete = prevDecks.find(d => d.id === deckId);
      const updatedDecks = prevDecks.filter(deck => deck.id !== deckId);
      if (deckToDelete) {
        toast.success(`Deck "${deckToDelete.title}" deleted.`);
      }
      return updatedDecks;
    });
    // If the active deck is the one being deleted, clear it
    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
    }
  }, [activeDeck]);

  // Function to load a specific deck by ID (useful for opening a deck)
  const loadDeck = useCallback((deckId: string): FlashcardDeck | null => {
    const deck = savedDecks.find(d => d.id === deckId) || null;
    setActiveDeck(deck); // Set as active deck when loaded
    return deck;
  }, [savedDecks]);

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
