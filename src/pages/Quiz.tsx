import { useState, createContext, useContext, useEffect } from "react";
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

export type QuestionType = "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed";

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  type: QuestionType;
  userAnswer?: string;
}

export interface Quiz {
  id: string;
  title: string;
  studyMaterial: string;
  questions: QuizQuestion[];
  dateCreated: string;
  lastModified: string;
  settings: {
    questionType: QuestionType;
    numberOfQuestions: number;
    verbatimMode: boolean;
    inputMode?: 'auto' | 'manual';
  };
  score?: {
    correct: number;
    total: number;
    percentage: number;
    completed: boolean;
    completedDate?: string;
    incorrectQuestions?: QuizQuestion[];
  };
  // Track current progress for preserving state
  progress?: {
    currentQuestionIndex: number;
    timeRemaining?: number;
  };
}

type QuizTab = "create" | "take";
export type QuizPhase = "creation" | "taking" | "results"; // Export QuizPhase

// Create a sessionStorage key for temporary quiz state
const QUIZ_PROGRESS_KEY = 'quiz-temp-progress';

export const QuizContext = createContext<{
  activeQuiz: Quiz | null;
  setActiveQuiz: (quiz: Quiz | null) => void;
  savedQuizzes: Quiz[];
  setSavedQuizzes: (quizzes: Quiz[]) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  quizPhase: QuizPhase;
  setQuizPhase: (phase: QuizPhase) => void;
  saveQuiz: (quiz: Quiz) => void;
  loadQuiz: (quizId: string) => void;
  deleteQuiz: (quizId: string) => void;
  handleCreateNewQuiz: () => void;
  saveProgress: (quizId: string, currentQuestionIndex: number) => void;
  loadProgress: (quizId: string) => number | undefined;
}>({
  activeQuiz: null,
  setActiveQuiz: () => {},
  savedQuizzes: [],
  setSavedQuizzes: () => {},
  isGenerating: false,
  setIsGenerating: () => {},
  quizPhase: "creation",
  setQuizPhase: () => {},
  saveQuiz: () => {},
  loadQuiz: () => {},
  deleteQuiz: () => {},
  handleCreateNewQuiz: () => {},
  saveProgress: () => {},
  loadProgress: () => undefined
});

export const useQuiz = () => useContext(QuizContext);

const Quiz = () => {
  const [activeTab, setActiveTab] = useState<QuizTab>("create");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useLocalStorage<Quiz[]>("quizzes", []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("creation");
  const location = useLocation();
  const { previousPagePath } = usePomodoroContext();

  // Check for URL parameters to load a specific quiz
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const quizId = searchParams.get('id');
    
    if (quizId) {
      loadQuiz(quizId);
    }

    // If we're returning from a pomodoro break, restore the quiz state
    if (previousPagePath === '/quiz' && activeQuiz && quizPhase === 'taking') {
      // The quiz state is already loaded, just make sure the tab is correct
      setActiveTab('take');
    }
  }, [location.search, previousPagePath]);

  // This effect ensures the correct tab is shown based on quiz phase
  useEffect(() => {
    if (quizPhase === "taking" || quizPhase === "results") {
      // Ensure we're on the take tab for both taking and results phases
      if (activeQuiz?.questions?.length > 0) {
        console.log("Switching to take tab due to quiz phase:", quizPhase);
        setActiveTab("take");
      }
    }
  }, [quizPhase, activeQuiz]);

  // Debug logging for tab changes and quiz phases
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
    console.log("Current quiz phase:", quizPhase);
    console.log("Active quiz exists:", !!activeQuiz);
    if (activeQuiz) {
      console.log("Questions count:", activeQuiz.questions.length);
    }
  }, [activeTab, quizPhase, activeQuiz]);

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
      setQuizPhase(quiz.score?.completed ? "results" : "taking");
      setActiveTab("take");
      toast.success(`"${quiz.title}" loaded successfully!`);
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
    setActiveTab("create");
  };

  const handleTabChange = (value: QuizTab) => {
    if (value === "take" && !activeQuiz?.questions?.length) {
      toast.error("Please create a quiz first!");
      return;
    }
    setActiveTab(value);
    if (value === "create") {
      setQuizPhase("creation");
    }
  };
  
  // Save quiz progress to sessionStorage for persistence between page navigations
  const saveProgress = (quizId: string, currentQuestionIndex: number) => {
    try {
      const progressMap = JSON.parse(sessionStorage.getItem(QUIZ_PROGRESS_KEY) || '{}');
      progressMap[quizId] = currentQuestionIndex;
      sessionStorage.setItem(QUIZ_PROGRESS_KEY, JSON.stringify(progressMap));
      
      // Also update the activeQuiz state
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