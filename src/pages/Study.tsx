import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import QuizCreationForm from "@/components/quiz/QuizCreationForm";
import QuizTaking from "@/components/quiz/QuizTaking";
import QuizResults from "@/components/quiz/QuizResults";
import QuizSavedList from "@/components/quiz/QuizSavedList";
import FlashcardCreationForm from "@/components/flashcard/FlashcardCreationForm";
import FlashcardViewer from "@/components/flashcard/FlashcardViewer";
import FlashcardSavedList from "@/components/flashcard/FlashcardSavedList";
import { toast } from "sonner"; 
import { QuizContext, QuizPhase, Quiz, QuizQuestion, QuestionType, useQuiz } from "@/context/QuizContext";
import { useFlashcard } from "@/context/FlashcardContextDefinition";
import { useLocation } from "react-router-dom";

// Constant for storing UI state in local storage
const FLASHCARD_UI_STATE_KEY = 'flashcard-ui-state';

// Export the quiz types to maintain compatibility
export type { QuestionType, QuizQuestion, Quiz };
export { QuizContext };

const Study = () => {
  // State for the main tabs
  const [activeStudyTab, setActiveStudyTab] = useState<"quiz" | "flashcard">("quiz");
  
  // State for sub-tabs in each section
  const [quizSubTab, setQuizSubTab] = useState<"create" | "take">("create");
  const [flashcardSubTab, setFlashcardSubTab] = useState<"create" | "view">("create");
  
  // Quiz states (reusing from Quiz.tsx)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useLocalStorage<Quiz[]>("quizzes", []);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("creation");

  // Get the flashcard context from the main provider
  const flashcardContext = useFlashcard();
  
  // Get location for URL parameters
  const location = useLocation();
  
  // On initial load, try to restore UI state from local storage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(FLASHCARD_UI_STATE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Restore UI state
        if (state.activeStudyTab) {
          setActiveStudyTab(state.activeStudyTab);
        }
        if (state.flashcardSubTab) {
          setFlashcardSubTab(state.flashcardSubTab);
        }
        
        // If we have an active deck, set the flashcard tab as active
        if (flashcardContext.activeDeck) {
          setActiveStudyTab("flashcard");
          setFlashcardSubTab("view");
        }
      }
    } catch (error) {
      console.error("Failed to restore UI state:", error);
    }
  }, [flashcardContext.activeDeck]); // Add flashcardContext.activeDeck as dependency

  // Handle URL-based navigation and tab changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');
    const viewing = urlParams.get('viewing');
    const deckId = urlParams.get('deckId');
    
    // Check for special create mode parameter - this has priority
    if (mode === 'flashcard-create') {
      setActiveStudyTab("flashcard");
      setFlashcardSubTab("create");
      return;
    }
    
    // Handle direct link to view flashcards
    if (viewing === 'flashcard') {
      setActiveStudyTab("flashcard");
      
      // If we have an activeDeck loaded, go to view mode
      // This happens when "Study Now" is clicked
      if (flashcardContext.activeDeck || deckId) {
        setFlashcardSubTab("view");
      }
    }
    // Add flashcardContext.activeDeck to dependency array to fix ESLint warning
  }, [location.search, flashcardContext.activeDeck]);

  // Quiz handlers
  const deleteQuiz = (quizId: string) => {
    const updatedQuizzes = savedQuizzes.filter(q => q.id !== quizId);
    setSavedQuizzes(updatedQuizzes);
    if (activeQuiz && activeQuiz.id === quizId) {
      setActiveQuiz(null);
      setQuizPhase("creation");
    }
    toast.success("Quiz deleted successfully!");
  };

  const saveQuiz = (quiz: Quiz) => {
    const updatedQuiz = {
      ...quiz,
      lastModified: new Date().toISOString()
    };
    
    const existingIndex = savedQuizzes.findIndex(q => q.id === quiz.id);
    if (existingIndex !== -1) {
      const updatedQuizzes = [...savedQuizzes];
      updatedQuizzes[existingIndex] = updatedQuiz;
      setSavedQuizzes(updatedQuizzes);
    } else {
      setSavedQuizzes([...savedQuizzes, updatedQuiz]);
    }
    
    toast.success("Quiz saved successfully!");
    setActiveQuiz(updatedQuiz);
  };

  const loadQuiz = (quizId: string) => {
    const quiz = savedQuizzes.find(q => q.id === quizId);
    if (quiz) {
      setActiveQuiz(quiz);
      setQuizPhase(quiz.score?.completed ? "results" : "taking");
      setQuizSubTab("take");
      toast.success(`"${quiz.title}" loaded successfully!`);
    }
  };

  const handleCreateNewQuiz = () => {
    setActiveQuiz(null);
    setQuizPhase("creation");
    setQuizSubTab("create");
  };

  // Save progress functions for quiz
  const saveProgress = (quizId: string, currentQuestionIndex: number) => {
    try {
      const progressMap = JSON.parse(sessionStorage.getItem('quiz-temp-progress') || '{}');
      progressMap[quizId] = currentQuestionIndex;
      sessionStorage.setItem('quiz-temp-progress', JSON.stringify(progressMap));
      
      if (activeQuiz && activeQuiz.id === quizId) {
        setActiveQuiz({
          ...activeQuiz,
          progress: { 
            ...activeQuiz.progress,
            currentQuestionIndex 
          }
        });
      }
    } catch (error) {
      console.error('Error saving quiz progress:', error);
    }
  };
  
  const loadProgress = (quizId: string) => {
    try {
      const progressMap = JSON.parse(sessionStorage.getItem('quiz-temp-progress') || '{}');
      return progressMap[quizId];
    } catch (error) {
      console.error('Error loading quiz progress:', error);
      return undefined;
    }
  };

  const handleQuizSubTabChange = (value: "create" | "take") => {
    if (value === "take" && (!activeQuiz || !activeQuiz?.questions?.length)) {
      toast.error("Please create a quiz first!");
      return;
    }
    setQuizSubTab(value);
    if (value === "create") {
      setQuizPhase("creation");
    }
  };

  const handleFlashcardSubTabChange = (value: "create" | "view") => {
    if (value === "view" && !flashcardContext.activeDeck) {
      toast.error("Please select a flashcard deck first!");
      return;
    }
    setFlashcardSubTab(value);
  };

  // Save UI state to localStorage whenever it changes
  useEffect(() => {
    try {
      const uiState = {
        activeStudyTab,
        flashcardSubTab,
      };
      localStorage.setItem(FLASHCARD_UI_STATE_KEY, JSON.stringify(uiState));
    } catch (error) {
      console.error("Failed to save UI state:", error);
    }
  }, [activeStudyTab, flashcardSubTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6e5]">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12 flex-grow">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-block -rotate-2 p-3 sm:p-4 lg:p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-3 sm:border-4 border-black mb-4 sm:mb-6 bg-[#9b87f5]">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white relative rotate-2">
              Study Center
            </h1>
          </div>
          <p className="text-[#1A1F2C] mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl font-medium px-3 sm:px-4 py-1.5 sm:py-2 bg-white inline-block border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Create and practice with quizzes and flashcards to master any subject
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-6xl mx-auto">
          {/* Main tabs for Quiz vs Flashcards */}
          <Tabs 
            value={activeStudyTab} 
            onValueChange={(value) => setActiveStudyTab(value as "quiz" | "flashcard")} 
            className="mx-auto"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <TabsList className="neo-border bg-white shadow-neo h-10 sm:h-12 lg:h-14 p-1 grid grid-cols-2 w-full max-w-xs sm:max-w-md">
                <TabsTrigger 
                  value="quiz" 
                  className="px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg font-bold data-[state=active]:bg-[#FF5C00] data-[state=active]:text-white data-[state=active]:shadow-none transition-all touch-target"
                >
                  Quiz
                </TabsTrigger>
                <TabsTrigger 
                  value="flashcard" 
                  className="px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg font-bold data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:shadow-none transition-all touch-target"
                >
                  Flashcards
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Quiz Content */}
            <TabsContent value="quiz" className="mt-0">
              <QuizContext.Provider value={{
                activeQuiz,
                setActiveQuiz,
                savedQuizzes,
                setSavedQuizzes,
                isGenerating: isGeneratingQuiz,
                setIsGenerating: setIsGeneratingQuiz,
                quizPhase,
                setQuizPhase,
                saveQuiz,
                loadQuiz,
                deleteQuiz: deleteQuiz,
                handleCreateNewQuiz,
                saveProgress,
                loadProgress
              }}>
                <Card className="border-3 sm:border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <Tabs value={quizSubTab} onValueChange={handleQuizSubTabChange} className="p-0">
                    <TabsContent value="create" className="p-4 sm:p-6 lg:p-8">
                      <QuizCreationForm />
                    </TabsContent>
                    
                    <TabsContent value="take" className="p-4 sm:p-6 lg:p-8">
                      {quizPhase === "taking" && activeQuiz?.questions?.length > 0 ? (
                        <QuizTaking />
                      ) : quizPhase === "results" && activeQuiz?.score ? (
                        <QuizResults />
                      ) : (
                        <div className="text-center py-6 sm:py-8 lg:py-16">
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold px-4 sm:px-6 py-3 sm:py-4 bg-[#FFDEE2] inline-block border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded">
                            Select a saved quiz to take or create a new one
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>

                {quizPhase === "creation" && <QuizSavedList />}
              </QuizContext.Provider>
            </TabsContent>
            
            {/* Flashcard Content */}
            <TabsContent value="flashcard" className="mt-0">
                <Card className="border-3 sm:border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <Tabs value={flashcardSubTab} onValueChange={handleFlashcardSubTabChange} className="p-0">
                    <TabsContent value="create" className="p-4 sm:p-6 lg:p-8">
                      <FlashcardCreationForm />
                    </TabsContent>
                    
                    <TabsContent value="view" className="p-4 sm:p-6 lg:p-8">
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Study;