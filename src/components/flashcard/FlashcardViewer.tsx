import React, { useState, useEffect, useRef, TouchEvent, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate import
import { Button } from "@/components/ui/button";
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Shuffle, ChevronLeft, ChevronRight, RotateCcw, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { FlashcardDisplayMode } from "@/types/flashcard";

const FlashcardViewer = () => {
  const { activeDeck, handleCreateNewDeck, setActiveDeck } = useFlashcard();
  // Add UserProfile context for achievement tracking
  const { trackFlashcardStudy } = useUserProfile();
  const navigate = useNavigate(); // Add navigate hook

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState(activeDeck?.cards || []);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionTracked, setSessionTracked] = useState(false);
  
  // Get the display mode from the deck or default to term-first
  const displayMode: FlashcardDisplayMode = activeDeck?.displayMode || "term-first";
  
  // Calculate total cards
  const totalCards = cards.length;
  
  // Refs for touch events
  const cardRef = useRef<HTMLDivElement>(null);
  const frontContentRef = useRef<HTMLDivElement>(null);
  const backContentRef = useRef<HTMLDivElement>(null);
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
      setSessionTracked(false);
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

  // Add new function to handle returning to study center
  const handleBackToStudyCenter = () => {
    // Clear the active deck before navigating
    setActiveDeck(null);
    // Navigate to study page with a special parameter that forces flashcard creation mode
    navigate("/study?mode=flashcard-create");
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
      <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
        <p className="text-lg sm:text-xl font-medium text-neo-black">No flashcard deck selected</p>
      </div>
    );
  }

  const cardContent = getCardContent();
  const frontLabel = displayMode === "term-first" ? "Term" : "Definition";
  const backLabel = displayMode === "term-first" ? "Definition" : "Term";

  // If completed, show congratulations screen
  if (completed && totalCards > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-4 sm:py-8 px-3 sm:px-4">
        <div className="w-full max-w-md sm:max-w-xl neo-border border-2 sm:border-4 border-black bg-[#9b87f5] shadow-neo sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-8 text-center rounded-lg">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-4 sm:mb-6">🎉 Congratulations!</h2>
          <p className="text-base sm:text-lg lg:text-xl text-white mb-6 sm:mb-10">You've completed all cards in this deck.</p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center mt-4">
            <Button 
              onClick={handleRestartDeck} 
              className="bg-white text-[#1A1F2C] neo-border border-2 border-black shadow-neo-sm sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex gap-2 items-center justify-center min-h-[44px] touch-target text-sm sm:text-base"
            >
              <RefreshCw className="h-4 w-4 flex-shrink-0" />
              <span>Study Again</span>
            </Button>            
            <Button 
              onClick={handleBackToStudyCenter}
              className="bg-[#f7e9d3] text-[#1A1F2C] neo-border border-2 border-black shadow-neo-sm sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex gap-2 items-center justify-center min-h-[44px] touch-target text-sm sm:text-base"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span>Back to Study Center</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const viewerContent = (
    <>
      {/* Progress bar and counters */}
      <div className={`w-full max-w-md sm:max-w-xl mb-2 ${fullscreenMode ? 'px-3 sm:px-4' : ''}`}>
        <div className="flex justify-between items-center mb-2 gap-2">
          {!fullscreenMode && (
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-[#1A1F2C] truncate flex-1 min-w-0">{activeDeck.title}</h2>
          )}
          <span className={`text-neo-muted bg-white px-2 sm:px-3 py-1 rounded-md neo-border shadow-neo-sm text-xs sm:text-sm font-medium flex-shrink-0 ${fullscreenMode ? 'ml-auto' : ''}`}>
            {currentCardIndex + 1}/{totalCards}
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-1.5 sm:h-2 bg-[#f0f0f0] rounded-full" 
          indicatorClassName="bg-[#9b87f5] rounded-full" 
        />
      </div>

      {/* Main flashcard */}
      <div 
        ref={cardRef}
        className={`w-full max-w-xs sm:max-w-md lg:max-w-xl aspect-[4/3] sm:aspect-[3/2] my-3 sm:my-4 cursor-pointer perspective-1000 relative touch-manipulation ${fullscreenMode ? 'scale-100 sm:scale-105' : ''}`}
        onClick={handleFlipCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`w-full h-full flip-card-inner ${flipped ? 'flipped' : ''}`}
        >
          {/* Front of card */}
          <div className="flip-card-front bg-white neo-border border-2 sm:border-4 border-black shadow-neo sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-6 flex flex-col justify-center rounded-lg">
            <div className="text-center w-full h-full flex items-center justify-center">
              <div className="font-bold text-[#1A1F2C] break-words hyphens-auto px-1 sm:px-2 w-full h-full flex items-center justify-center">
                <div ref={frontContentRef} className="card-content-scaling">{cardContent.front}</div>
              </div>
            </div>
          </div>
          
          {/* Back of card */}
          <div className="flip-card-back bg-[#F9F6FF] neo-border border-2 sm:border-4 border-black shadow-neo sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-6 flex flex-col justify-center rounded-lg">
            <div className="text-center w-full h-full flex items-center justify-center">
              <div className="font-medium text-[#1A1F2C] py-1 sm:py-2 px-2 sm:px-4 rounded-md break-words hyphens-auto flex items-center justify-center h-full w-full">
                <div ref={backContentRef} className="card-content-scaling">{cardContent.back}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Improved navigation controls */}
      <div className="w-full max-w-xs sm:max-w-md lg:max-w-xl mt-4 sm:mt-6">
        {/* Card flip indicator */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm bg-[#f9f6ff] px-2 sm:px-4 py-1 rounded-md border border-[#9b87f5] text-[#1A1F2C] text-center">
            <span className="font-medium">{flipped ? backLabel : frontLabel}</span>
            <span className="hidden sm:inline"> • Tap card to flip • Swipe to navigate</span>
            <span className="sm:hidden"> • Tap to flip</span>
          </div>
        </div>
        
        {/* Main controls */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex justify-start">
            <Button
              onClick={handlePrevCard}
              className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-[#1A1F2C] flex items-center gap-1 px-2 sm:px-4 py-2 min-h-[44px] touch-target text-xs sm:text-sm"
              title="Previous Card (←)"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={() => setFlipped(!flipped)}
              variant="outline"
              className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-full px-2 sm:px-4 py-2 min-h-[44px] touch-target text-xs sm:text-sm"
              title="Flip Card (Space)"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline sm:ml-1">Flip</span>
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleNextCard}
              className={`neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1 px-2 sm:px-4 py-2 min-h-[44px] touch-target text-xs sm:text-sm
                ${currentCardIndex === totalCards - 1 ? "bg-[#FFC225] text-[#1A1F2C]" : "bg-[#9b87f5] text-white"}`}
              title={currentCardIndex === totalCards - 1 ? "Complete Deck (→)" : "Next Card (→)"}
              size="sm"
            >
              <span className="hidden sm:inline">{currentCardIndex === totalCards - 1 ? "Complete" : "Next"}</span>
              <span className="sm:hidden">{currentCardIndex === totalCards - 1 ? "✓" : "→"}</span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 sm:hidden" />
            </Button>
          </div>
        </div>
        
        {/* Additional controls */}
        <div className="flex justify-center mt-3 sm:mt-4 gap-2 sm:gap-4 flex-wrap">
          <Button
            onClick={handleShuffleCards}
            variant="outline"
            className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[36px] touch-target text-xs sm:text-sm px-2 sm:px-3"
            title="Shuffle Cards"
            size="sm"
          >
            <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>Shuffle</span>
          </Button>
          
          <Button
            onClick={handleRestartDeck}
            variant="outline"
            className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[36px] touch-target text-xs sm:text-sm px-2 sm:px-3"
            title="Restart Deck"
            size="sm"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>Restart</span>
          </Button>
          
          {/* Added Back to Study Center button */}
          <Button
            onClick={handleBackToStudyCenter}
            variant="outline"
            className="bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[36px] touch-target text-xs sm:text-sm px-2 sm:px-3"
            title="Return to Study Center"
            size="sm"
          >
            <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Study Center</span>
            <span className="sm:hidden">Center</span>
          </Button>
        </div>
      </div>
      
      {/* Toggle fullscreen study mode button */}
      <Button
        onClick={() => setFullscreenMode(!fullscreenMode)}
        variant="outline" 
        className="mt-4 sm:mt-6 mx-auto block bg-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-h-[36px] touch-target text-xs sm:text-sm px-3 sm:px-4"
        size="sm"
      >
        <span className="hidden sm:inline">{fullscreenMode ? "Exit Focus Mode" : "Enter Focus Mode"}</span>
        <span className="sm:hidden">{fullscreenMode ? "Exit Focus" : "Focus Mode"}</span>
      </Button>
    </>
  );

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] mb-4 sm:mb-8 px-3 sm:px-4 ${fullscreenMode ? 'fixed inset-0 z-50 bg-[#fff6e5] p-3 sm:p-4' : ''}`}>
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
        
        /* Add swipe animation hints */
        @keyframes hintSwipe {
          0% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
          100% { transform: translateX(0); }
        }
        
        /* Improved styling for flashcard content */
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 0.75rem;
          overflow: hidden; /* Ensure card itself clips overflow */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem; /* Add padding inside the card */
        }
        
        /* Ensure text container within card can scroll independently */
        /* Modified: Remove independent scrolling, allow flex centering */
        .flip-card-front > div, .flip-card-back > div {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center; /* Center text within its container */
          overflow: hidden; /* Hide overflow within the flex container */
        }

        /* Target the actual text content div */
        .card-content-scaling {
          max-width: 100%;
          max-height: 100%;
          overflow-wrap: break-word; /* Allow breaking long words */
          word-break: break-word; /* Ensure words break */
          text-wrap: balance; /* Improve text wrapping balance if supported */
          /* Enhanced mobile-first font sizing with better scaling */
          font-size: clamp(0.875rem, 3vw, 1.75rem); /* Mobile: 14px, grows with viewport, max 28px */
          line-height: 1.3; /* Tighter line height for mobile readability */
          overflow: hidden; /* Hide any final overflow */
          text-align: center; /* Ensure centered text alignment */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem; /* Small padding for breathing room */
        }
        
        /* Responsive adjustments for different screen sizes */
        @media (min-width: 640px) {
          .card-content-scaling {
            font-size: clamp(1rem, 2.5vw, 1.5rem); /* Tablet: 16px to 24px */
            line-height: 1.4;
            padding: 0.5rem;
          }
        }
        
        @media (min-width: 1024px) {
          .card-content-scaling {
            font-size: clamp(1.125rem, 2vw, 1.75rem); /* Desktop: 18px to 28px */
            line-height: 1.5;
            padding: 0.75rem;
          }
        }
        
        /* Mobile-specific touch improvements */
        @media (max-width: 639px) {
          .flip-card-inner {
            transition: transform 0.4s; /* Faster transitions on mobile */
          }
          
          .perspective-1000 {
            perspective: 800px; /* Slightly reduced perspective for mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default FlashcardViewer;
