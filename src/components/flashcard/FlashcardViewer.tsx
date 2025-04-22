import React, { useState, useEffect, useRef, TouchEvent, useCallback } from "react";
import { Link } from "react-router-dom"; // Import Link
import { Button } from "@/components/ui/button";
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { useUserProfile } from "@/context/UserProfileContext"; // Add this import
import { Shuffle, ChevronLeft, ChevronRight, RotateCcw, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { FlashcardDisplayMode } from "@/types/flashcard";

const FlashcardViewer = () => {
  const { activeDeck, handleCreateNewDeck } = useFlashcard();
  // Add UserProfile context for achievement tracking
  const { trackFlashcardStudy } = useUserProfile();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState(activeDeck?.cards || []);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionTracked, setSessionTracked] = useState(false); // Add this state to prevent duplicate tracking
  
  // Get the display mode from the deck or default to term-first
  const displayMode: FlashcardDisplayMode = activeDeck?.displayMode || "term-first";
  
  // Calculate total cards
  const totalCards = cards.length;
  
  // Refs for touch events
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Progress calculation
  const progressPercentage = cards.length > 0 
    ? Math.round(((currentCardIndex + 1) / cards.length) * 100) 
    : 0;
  
  useEffect(() => {
    if (activeDeck?.cards) {
      setCards(activeDeck.cards);
      setCurrentCardIndex(0);
      setFlipped(false);
      setKnownCards(new Set());
      setCompleted(false);
      setSessionTracked(false); // Reset session tracking
    }
  }, [activeDeck]);
  // Remove automatic completion when reaching the last card
  // The user will now need to explicitly click "Next" on the last card

  useEffect(() => {
    // Track study session when deck is completed
    if (completed && !sessionTracked && activeDeck) { // Ensure activeDeck exists
      // Pass the total number of cards in the deck
      trackFlashcardStudy(totalCards);
      setSessionTracked(true);
    }
    // Removed activeDeck.id from dependencies as it's not directly used here
    // Added totalCards to dependencies as it's used in the function call
  }, [completed, sessionTracked, activeDeck, trackFlashcardStudy, totalCards]);

  const handlePrevCard = useCallback(() => {
    if (completed) {
      setCompleted(false);
    }
    setFlipped(false);
    setCurrentCardIndex(prev => (prev - 1 + totalCards) % totalCards);
  }, [totalCards, completed]);
  const handleNextCard = useCallback(() => {
    setFlipped(false);
    
    // Check if we're on the last card
    if (currentCardIndex === totalCards - 1) {
      // If on the last card, show completion screen
      setCompleted(true);
    } else {
      // Otherwise, go to next card
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [currentCardIndex, totalCards]);

  const handleRestartDeck = () => {
    setCurrentCardIndex(0);
    setFlipped(false);
    setCompleted(false);
    setSessionTracked(false); // Reset session tracking
    toast.success("Starting deck from beginning");
  };

  useEffect(() => {
    // Add keyboard event listener for spacebar to flip card
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling
        setFlipped(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'Escape' && fullscreenMode) {
        e.preventDefault();
        setFullscreenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevCard, handleNextCard, fullscreenMode]);

  const currentCard = cards[currentCardIndex];

  const handleFlipCard = () => {
    setFlipped(!flipped);
  };

  const handleShuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    setFlipped(false);
    setCompleted(false);
    setSessionTracked(false); // Reset session tracking
    toast.success("Cards shuffled");
  };

  const handleMarkCard = (known: boolean) => {
    const newKnownCards = new Set(knownCards);
    
    if (known) {
      newKnownCards.add(currentCard.id);
      toast.success("Card marked as known");
    } else {
      newKnownCards.delete(currentCard.id);
    }
    
    setKnownCards(newKnownCards);
    handleNextCard();
  };

  // Touch event handlers for swiping with improved vertical detection
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    // Optional: add visual feedback while swiping
    if (cardRef.current && touchStartX.current && touchEndX.current) {
      const distance = touchEndX.current - touchStartX.current;
      if (Math.abs(distance) > 30) {
        // Limit the rotation angle
        const rotationAngle = Math.min(Math.max(distance / 20, -7.5), 7.5);
        cardRef.current.style.transform = `rotateY(${flipped ? 180 : 0}deg) rotateZ(${rotationAngle}deg)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    
    const xDistance = touchStartX.current - touchEndX.current;
    const yDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    
    // Only register horizontal swipes if they're more horizontal than vertical
    if (Math.abs(xDistance) > Math.abs(yDistance)) {
      if (Math.abs(xDistance) > minSwipeDistance) {
        if (xDistance > 0) {
          // Swipe left, next card
          handleNextCard();
        } else {
          // Swipe right, previous card
          handlePrevCard();
        }
      }
    } else {
      // Vertical swipes can be used to flip card
      if (Math.abs(yDistance) > minSwipeDistance) {
        handleFlipCard();
      }
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
    
    // Reset any transform applied during swiping
    if (cardRef.current) {
      cardRef.current.style.transform = flipped ? 'rotateY(180deg)' : '';
    }
  };

  // Helper function to get front and back content based on display mode
  const getCardContent = () => {
    if (!currentCard) return { front: "", back: "" };
    
    return displayMode === "term-first" 
      ? { front: currentCard.term, back: currentCard.definition }
      : { front: currentCard.definition, back: currentCard.term };
  };

  if (!activeDeck || !currentCard) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-medium">No flashcard deck selected</p>
      </div>
    );
  }

  const cardContent = getCardContent();
  const frontLabel = displayMode === "term-first" ? "Term" : "Definition";
  const backLabel = displayMode === "term-first" ? "Definition" : "Term";

  // If completed, show congratulations screen
  if (completed && totalCards > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <div className="w-full max-w-xl neo-border border-4 border-black bg-[#9b87f5] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
          <h2 className="text-3xl font-black text-white mb-6">🎉 Congratulations!</h2>
          <p className="text-xl text-white mb-10">You've completed all cards in this deck.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <Button 
              onClick={handleRestartDeck} 
              className="bg-white text-[#1A1F2C] neo-border border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Study Again
            </Button>            
            <Button 
              onClick={() => window.location.href = '/study'} // Navigate and refresh
              className="bg-[#f7e9d3] text-[#1A1F2C] neo-border border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Study Center
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const viewerContent = (
    <>
      {/* Progress bar and counters */}
      <div className={`w-full max-w-xl mb-2 ${fullscreenMode ? 'px-4' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          {!fullscreenMode && (
            <h2 className="text-xl font-bold text-[#1A1F2C] truncate max-w-[60%]">{activeDeck.title}</h2>
          )}
          <span className={`text-[#6B7280] bg-white px-3 py-1 rounded-md neo-border shadow-neo-sm ${fullscreenMode ? 'ml-auto' : ''}`}>
            {currentCardIndex + 1}/{totalCards}
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-[#f0f0f0]" 
          indicatorClassName="bg-[#9b87f5]" 
        />
      </div>

      {/* Main flashcard */}
      <div 
        ref={cardRef}
        className={`w-full max-w-xl aspect-[3/2] my-4 cursor-pointer perspective-1000 relative ${fullscreenMode ? 'scale-105' : ''}`}
        onClick={handleFlipCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`w-full h-full flip-card-inner ${flipped ? 'flipped' : ''}`}
        >
          {/* Front of card */}
          <div className="flip-card-front bg-white neo-border border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-center">
            <div className="text-center w-full">
              <div className="text-2xl md:text-3xl font-bold mb-2 text-[#1A1F2C] overflow-hidden">
                {cardContent.front}
              </div>
            </div>
          </div>
          
          {/* Back of card */}
          <div className="flip-card-back bg-[#F9F6FF] neo-border border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-center">
            <div className="text-center w-full">
              {/* Reduced font size for definition */}
              <div className="text-base md:text-lg font-medium mb-2 text-[#1A1F2C] overflow-y-auto max-h-[70vh]">
                {cardContent.back}
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Improved navigation controls */}
      <div className="w-full max-w-xl mt-6">
        {/* Card flip indicator */}
        <div className="flex justify-center mb-4">
          <div className="text-sm bg-[#f9f6ff] px-4 py-1 rounded-md border border-[#9b87f5] text-[#1A1F2C]">
            {flipped ? backLabel : frontLabel} • Tap card to flip • Swipe to navigate
          </div>
        </div>
        
        {/* Main controls */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex justify-start">
            <Button
              onClick={handlePrevCard}
              className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-[#1A1F2C] flex items-center gap-1"
              title="Previous Card (←)"
              size="default"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={() => setFlipped(!flipped)}
              variant="outline"
              className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-full"
              title="Flip Card (Space)"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Flip</span>
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleNextCard}
              className={`neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1
                ${currentCardIndex === totalCards - 1 ? "bg-[#FFC225] text-[#1A1F2C]" : "bg-[#9b87f5] text-white"}`}

              title={currentCardIndex === totalCards - 1 ? "Complete Deck (→)" : "Next Card (→)"}
              size="default"
            >
              <span className="hidden sm:inline">{currentCardIndex === totalCards - 1 ? "Complete" : "Next"}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Additional controls */}
        <div className="flex justify-center mt-4 gap-4">
          <Button
            onClick={handleShuffleCards}
            variant="outline"
            className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            title="Shuffle Cards"
            size="sm"
          >
            <Shuffle className="h-4 w-4 mr-1" />
            <span>Shuffle</span>
          </Button>
          
          <Button
            onClick={handleRestartDeck}
            variant="outline"
            className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            title="Restart Deck"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span>Restart</span>
          </Button>
        </div>
      </div>
      
      {/* Toggle fullscreen study mode button */}
      <Button
        onClick={() => setFullscreenMode(!fullscreenMode)}
        variant="outline" 
        className="mt-6 mx-auto block bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        size="sm"
      >
        {fullscreenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
      </Button>
    </>
  );

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] mb-8 ${fullscreenMode ? 'fixed inset-0 z-50 bg-[#fff6e5] p-4' : ''}`}>
      {viewerContent}
      
      {/* CSS for 3D card flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .flipped {
          transform: rotateY(180deg);
        }
        
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 0.75rem;
          overflow-y: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .flip-card-back {
          transform: rotateY(180deg);
        }
        
        /* Add swipe animation hints */
        @keyframes hintSwipe {
          0% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default FlashcardViewer;