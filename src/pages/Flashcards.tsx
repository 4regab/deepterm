import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import FlashcardCreationForm from "@/components/flashcard/FlashcardCreationForm";
import FlashcardViewer from "@/components/flashcard/FlashcardViewer";
import FlashcardSavedList from "@/components/flashcard/FlashcardSavedList";
import { toast } from "sonner"; 
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { useLocation } from "react-router-dom";

// Constant for storing UI state in local storage
const FLASHCARD_UI_STATE_KEY = 'flashcard-ui-state';

const Flashcards = () => {
  // Set document title on mount
  useEffect(() => {
    document.title = "Flashcard Creator - DeepTerm";
  }, []);

  // State for sub-tabs in flashcard section
  const [flashcardSubTab, setFlashcardSubTab] = useState<"create" | "view">("create");
  
  // Get the flashcard context from the main provider
  const flashcardContext = useFlashcard();
  
  // Get location for URL parameters
  const location = useLocation();
  
  // One-time flag to avoid re-running restore
  const restoredRef = useRef(false);

  // On initial load only, try to restore UI state from local storage
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const savedState = localStorage.getItem(FLASHCARD_UI_STATE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Restore UI state (guard against redundant sets)
        if (state.flashcardSubTab && state.flashcardSubTab !== flashcardSubTab) {
          setFlashcardSubTab(state.flashcardSubTab);
        }
      }
    } catch (error) {
      console.error("Failed to restore UI state:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle URL-based navigation and tab changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    const viewing = urlParams.get('viewing');
    const deckId = urlParams.get('deckId');

    // Special create mode parameter - highest priority
    if (mode === 'flashcard-create') {
      if (flashcardSubTab !== "create") setFlashcardSubTab("create");
      return;
    }

    // Direct link to view flashcards
    if (viewing === 'flashcard') {
      // If we have an activeDeck loaded, go to view mode
      if ((flashcardContext.activeDeck || deckId) && flashcardSubTab !== "view") {
        setFlashcardSubTab("view");
      }
    }
  }, [location.search, flashcardContext.activeDeck, flashcardSubTab]);

  // When an active deck becomes available, ensure View is selected
  useEffect(() => {
    if (flashcardContext.activeDeck) {
      if (flashcardSubTab !== "view") setFlashcardSubTab("view");
    }
  }, [flashcardContext.activeDeck, flashcardSubTab]);

  const handleFlashcardSubTabChange = (value: string) => {
    const v = (value === "create" || value === "view") ? value : "create";
    if (v === "view" && !flashcardContext.activeDeck) {
      toast.error("Please select a flashcard deck first!");
      return;
    }
    setFlashcardSubTab(v);
  };

  // Save UI state to localStorage whenever it changes
  useEffect(() => {
    try {
      const uiState = {
        flashcardSubTab,
      };
      localStorage.setItem(FLASHCARD_UI_STATE_KEY, JSON.stringify(uiState));
    } catch (error) {
      console.error("Failed to save UI state:", error);
    }
  }, [flashcardSubTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6e5]">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 flex-grow">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-block -rotate-2 p-3 sm:p-4 lg:p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-3 sm:border-4 border-black mb-4 sm:mb-6 bg-[#9b87f5]">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white relative rotate-2">
              Flashcard Creator
            </h1>
          </div>
          <p className="text-[#1A1F2C] mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl font-medium px-3 sm:px-4 py-1.5 sm:py-2 bg-white inline-block border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Create and study with AI-generated flashcards to master key concepts
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-6xl mx-auto">
          <Card className="border-3 sm:border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <Tabs value={flashcardSubTab} onValueChange={handleFlashcardSubTabChange} className="p-0">
              <div className="flex justify-center p-4 sm:p-6 lg:p-8 pb-0">
                <TabsList className="neo-border bg-white shadow-neo h-10 sm:h-12 lg:h-14 p-1 grid grid-cols-2 w-full max-w-xs sm:max-w-md">
                  <TabsTrigger 
                    value="create" 
                    className="px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg font-bold data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:shadow-none transition-all touch-target"
                  >
                    Create Deck
                  </TabsTrigger>
                  <TabsTrigger 
                    value="view" 
                    className="px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg font-bold data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:shadow-none transition-all touch-target"
                  >
                    Study Deck
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="create" className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
                <FlashcardCreationForm />
              </TabsContent>
              
              <TabsContent value="view" className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
                {flashcardContext.activeDeck ? (
                  <FlashcardViewer />
                ) : (
                  <div className="text-center py-6 sm:py-8 lg:py-16">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold px-4 sm:px-6 py-3 sm:py-4 bg-[#E5DEFF] inline-block border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded">
                      Select a flashcard deck to study or create a new one
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>

          <FlashcardSavedList />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Flashcards;