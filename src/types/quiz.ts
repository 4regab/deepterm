export type QuestionType = "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed";

export interface QuizQuestion {
  id: number | string;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface QuizGenerationResponse {
  success: boolean;
  questions?: QuizQuestion[];
  error?: string;
}
