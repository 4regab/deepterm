// filepath: src/context/QuizContext.tsx
import { createContext, useContext } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage"; // Assuming this hook exists

// Define Types (moved from Quiz.tsx)
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
  progress?: {
    currentQuestionIndex: number;
    timeRemaining?: number;
  };
}

export type QuizPhase = "creation" | "taking" | "results";

// Define Context Interface
export interface QuizContextType {
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
}

// Create Context with default values
export const QuizContext = createContext<QuizContextType>({
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
  loadProgress: () => undefined,
});

// Create Hook for using the context
export const useQuiz = () => useContext(QuizContext);

// Constant for session storage key
export const QUIZ_PROGRESS_KEY = 'quiz-temp-progress';
