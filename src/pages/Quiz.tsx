import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuizCreationForm from "@/components/quiz/QuizCreationForm";
import QuizSavedList from "@/components/quiz/QuizSavedList";
import QuizTaking from "@/components/quiz/QuizTaking";
import QuizResults from "@/components/quiz/QuizResults";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useLocation } from "react-router-dom";
// Import context, types, hook, and constant from the new file
import { 
  QuizContext, 
  type Quiz, // Use type-only import for Quiz type
  QuizPhase, 
  QUIZ_PROGRESS_KEY 
} from "@/context/QuizContext";

const Quiz = () => {
  // Set document title on mount
  useEffect(() => {
    document.title = "Quiz Maker - DeepTerm";
  }, []);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useLocalStorage<Quiz[]>("quizzes", []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("creation");
  const location = useLocation();

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
      setActiveQuiz(quiz); // Set the original quiz
      // Determine phase based on loaded quiz state
      if (quiz.score?.completed) {
        setQuizPhase("results");
      } else {
        setQuizPhase("creation"); // Start in creation/edit mode
      }
      toast.success(`"${quiz.title}" loaded for editing!`);
    } else {
      toast.error("Could not find the quiz to load.");
    }
  };

  const takeQuiz = (quizId: string) => {
    const quiz = savedQuizzes.find(q => q.id === quizId);
    if (quiz) {
      // Reset user answers for a fresh quiz attempt
      const { score, ...quizWithoutScore } = quiz;
      const freshQuiz = {
        ...quizWithoutScore,
        questions: quiz.questions.map(q => {
          const { userAnswer, ...cleanQuestion } = q;
          return cleanQuestion;
        })
      };
      
      setActiveQuiz(freshQuiz);
      setQuizPhase("taking");
      toast.success(`Starting "${quiz.title}"!`);
    } else {
      toast.error("Could not find the quiz to take.");
    }
  };

  const deleteQuiz = (quizId: string) => {
    const updatedQuizzes = savedQuizzes.filter(q => q.id !== quizId);
    setSavedQuizzes(updatedQuizzes);
    if (activeQuiz && activeQuiz.id === quizId) {
      setActiveQuiz(null);
      setQuizPhase("creation");
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

  // Check for URL parameters to load a specific quiz
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const quizId = searchParams.get('id');
    
    if (quizId) {
      // Find the quiz without immediately setting state
      const quizToLoad = savedQuizzes.find(q => q.id === quizId);
      if (quizToLoad) {
        setActiveQuiz(quizToLoad);
        // Set phase based on loaded quiz state
        if (quizToLoad.score?.completed) {
          setQuizPhase("results");
        } else {
          setQuizPhase("creation"); // Default to creation/edit if no progress
        }
        toast.success(`"${quizToLoad.title}" loaded!`);
      } else {
        toast.error("Quiz ID from URL not found.");
      }
    }
  }, [location.search, savedQuizzes]);

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
      takeQuiz,
      deleteQuiz,
      handleCreateNewQuiz,
      saveProgress,
      loadProgress
    }}>
      <div className="min-h-screen flex flex-col bg-[#fff6e5]">
        <Navbar />
        
        <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-grow">
          {/* Only show header in creation phase */}
          {quizPhase === "creation" && (
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
          )}

          <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
            {/* Conditional rendering based on quiz phase */}
            {quizPhase === "taking" ? (
              <QuizTaking />
            ) : quizPhase === "results" ? (
              <QuizResults />
            ) : (
              /* Default creation phase */
              <>
                <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <QuizCreationForm />
                  </div>
                </Card>

                <QuizSavedList />
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </QuizContext.Provider>
  );
};

export default Quiz;