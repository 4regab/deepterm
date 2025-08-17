import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import QuizCreationForm from "@/components/quiz/QuizCreationForm";
import QuizTaking from "@/components/quiz/QuizTaking";
import QuizResults from "@/components/quiz/QuizResults";
import QuizSavedList from "@/components/quiz/QuizSavedList";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useLocation } from "react-router-dom";
import { usePomodoroContext } from "@/hooks/usePomodoroContext"; // Corrected import path
// Import context, types, hook, and constant from the new file
import { 
  QuizContext, 
  type Quiz, // Use type-only import for Quiz type
  QuizPhase, 
  useQuiz, 
  QUIZ_PROGRESS_KEY 
} from "@/context/QuizContext";

type QuizTab = "create" | "take"; // Keep this type local if only used here

const Quiz = () => {
  const [activeTab, setActiveTab] = useState<QuizTab>("create");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useLocalStorage<Quiz[]>("quizzes", []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("creation");
  const location = useLocation();
  const { previousPagePath } = usePomodoroContext();

  // --- Function Definitions (Moved Before useEffect) ---

  // Load quiz progress from sessionStorage
  const loadProgress = (quizId: string): number | undefined => {
    try {
      const progressMap = JSON.parse(sessionStorage.getItem(QUIZ_PROGRESS_KEY) || '{}');
      return progressMap[quizId];
    } catch (error) {
      console.error('Error loading quiz progress:', error);
      return undefined;
    }
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
      // Load saved progress if available
      const savedProgress = loadProgress(quizId);
      const quizWithProgress = { 
        ...quiz, 
        progress: savedProgress !== undefined ? { 
          currentQuestionIndex: savedProgress 
        } : undefined 
      };
      
      setActiveQuiz(quizWithProgress);
      // Determine phase based on loaded quiz state
      if (quiz.score?.completed) {
        setQuizPhase("results");
        setActiveTab("take"); // Show results in the take tab
      } else {
        setQuizPhase("creation"); // Start in creation/edit mode
        setActiveTab("create"); // Switch to create tab for editing
      }
      toast.success(`"${quiz.title}" loaded for editing!`);
    } else {
      toast.error("Could not find the quiz to load.");
    }
  };

  const deleteQuiz = (quizId: string) => {
    const updatedQuizzes = savedQuizzes.filter(q => q.id !== quizId);
    setSavedQuizzes(updatedQuizzes);
    if (activeQuiz && activeQuiz.id === quizId) {
      setActiveQuiz(null);
      setQuizPhase("creation");
      setActiveTab("create"); // Go back to create tab after deleting active quiz
    }
    toast.success("Quiz deleted successfully!");
    
    // Also remove any saved progress
    try {
      const progressMap = JSON.parse(sessionStorage.getItem(QUIZ_PROGRESS_KEY) || '{}');
      delete progressMap[quizId];
      sessionStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progressMap));
    } catch (error) {
      console.error('Error deleting quiz progress:', error);
    }
  };

  const handleCreateNewQuiz = () => {
    setActiveQuiz(null);
    setQuizPhase("creation");
    setActiveTab("create");
  };

  // Optimized saveProgress to prevent circular activeQuiz updates and eliminate feedback loops
  const saveProgress = (quizId: string, currentQuestionIndex: number) => {
    try {
      const progressMap = JSON.parse(sessionStorage.getItem(QUIZ_PROGRESS_KEY) || '{}');
      progressMap[quizId] = currentQuestionIndex;
      sessionStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progressMap));
      
      // Eliminated circular update - don't modify activeQuiz here to prevent cascade
      // The progress is already saved to sessionStorage and will be loaded when needed
      // This prevents the circular dependency that was causing flickering
    } catch (error) {
      console.error('Error saving quiz progress:', error);
    }
  };

  // --- End Function Definitions ---

  // --- Add handleTabChange definition here ---
  const handleTabChange = (value: QuizTab) => {
    if (value === "take" && !activeQuiz?.questions?.length) {
      toast.error("Please create a quiz first!");
      return;
    }
    setActiveTab(value);
    if (value === "create") {
      // When switching to create tab, ensure phase is creation
      // unless an active quiz is already loaded (which implies editing)
      if (!activeQuiz) {
        setQuizPhase("creation");
      }
    } else if (value === "take" && activeQuiz) {
      // When switching to take tab with an active quiz,
      // set phase based on completion status
      setQuizPhase(activeQuiz.score?.completed ? "results" : "taking");
    }
  };
  // --- End handleTabChange definition ---

  // Check for URL parameters to load a specific quiz
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const quizId = searchParams.get('id');
    
    if (quizId) {
      // Find the quiz without immediately setting state
      const quizToLoad = savedQuizzes.find(q => q.id === quizId);
      if (quizToLoad) {
        // Load saved progress if available
        const savedProgress = loadProgress(quizId);
        const quizWithProgress = { 
          ...quizToLoad, 
          progress: savedProgress !== undefined ? { 
            currentQuestionIndex: savedProgress 
          } : undefined 
        };
        setActiveQuiz(quizWithProgress);
        // Set phase based on loaded quiz state
        if (quizToLoad.score?.completed) {
          setQuizPhase("results");
        } else {
          // If not completed, assume we want to edit or continue taking
          // The QuizSavedList edit button now sets phase to "creation"
          // If loaded via URL, maybe default to "taking" if progress exists?
          if (savedProgress !== undefined) {
            setQuizPhase("taking");
          } else {
            setQuizPhase("creation"); // Default to creation/edit if no progress
          }
        }
        toast.success(`"${quizToLoad.title}" loaded!`);
      } else {
        toast.error("Quiz ID from URL not found.");
        // Optionally clear the URL parameter or redirect
      }
    }

    // If we're returning from a pomodoro break, restore the quiz state
    if (previousPagePath === '/quiz' && activeQuiz && quizPhase === 'taking') {
      // The quiz state is already loaded, just make sure the tab is correct
      setActiveTab('take');
    }
    // Dependencies: location.search, previousPagePath, savedQuizzes (to find quiz), activeQuiz, quizPhase
    // Removed loadQuiz from deps as it causes infinite loops if defined inside component
    // loadProgress is also defined inside, but seems stable. Consider moving helpers outside.
  }, [location.search, previousPagePath, savedQuizzes, activeQuiz, quizPhase]);
  // Optimized effect to prevent unnecessary tab/phase changes that could trigger cascades
  useEffect(() => {
    if (quizPhase === "taking" || quizPhase === "results") {
      // Only change tab if needed and quiz has questions
      if (activeQuiz?.questions?.length > 0 && activeTab !== "take") {
        console.log("Switching to take tab due to quiz phase:", quizPhase);
        setActiveTab("take");
      }
    } else if (quizPhase === "creation" && activeQuiz?.id && activeTab !== "create") {
      // Only switch to create tab if we have an actual quiz to edit
      console.log("Switching to create tab for editing quiz:", activeQuiz.id);
      setActiveTab("create");
    }
  }, [quizPhase, activeQuiz?.questions?.length, activeQuiz?.id, activeTab]); // Optimized dependencies

  // Debug logging for tab changes and quiz phases
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
    console.log("Current quiz phase:", quizPhase);
    console.log("Active quiz exists:", !!activeQuiz);
    if (activeQuiz) {
      console.log("Questions count:", activeQuiz.questions.length);
    }
  }, [activeTab, quizPhase, activeQuiz]);

  // Determine what content to show in the take tab based on quiz phase
  const renderTakeTabContent = () => {
    if (!activeQuiz) {
      return (
        <div className="text-center py-8 sm:py-16">
          <p className="text-xl sm:text-2xl font-bold px-6 py-4 bg-[#FFDEE2] inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Select a saved quiz to take or create a new one
          </p>
        </div>
      );
    }

    if (quizPhase === "taking" && activeQuiz?.questions?.length > 0) {
      return <QuizTaking />;
    } 
    
    if (quizPhase === "results" && activeQuiz?.score) {
      return <QuizResults />;
    }

    return (
      <div className="text-center py-8 sm:py-16">
        <p className="text-xl sm:text-2xl font-bold px-6 py-4 bg-[#FFDEE2] inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          No questions found. Please create a quiz first.
        </p>
      </div>
    );
  };

  return (
    <QuizContext.Provider value={{
      activeQuiz,
      setActiveQuiz,
      savedQuizzes,
      setSavedQuizzes,
      isGenerating,
      setIsGenerating,
      quizPhase,
      setQuizPhase,
      saveQuiz,
      loadQuiz,
      deleteQuiz,
      handleCreateNewQuiz,
      saveProgress,
      loadProgress
    }}>
      <div className="min-h-screen flex flex-col bg-[#fff6e5]">
        <Navbar />
        
        <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-grow">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block -rotate-2 p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black mb-6 bg-[#FF5C00]">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight relative rotate-2">
                Quiz Maker
              </h1>
            </div>
            <p className="text-[#1A1F2C] mt-6 text-lg sm:text-xl font-medium px-4 py-2 bg-white inline-block border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Create and take quizzes based on your study material
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
            <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="p-0">                
                <TabsContent value="create" className="p-6 sm:p-8">
                  <QuizCreationForm />
                </TabsContent>
                
                <TabsContent value="take" className="p-6 sm:p-8">
                  {renderTakeTabContent()}
                </TabsContent>
              </Tabs>
            </Card>

            {quizPhase === "creation" && <QuizSavedList />}
          </div>
        </main>

        <Footer />
      </div>
    </QuizContext.Provider>
  );
};

export default Quiz;