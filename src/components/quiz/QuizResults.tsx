import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, RefreshCw, PenSquare } from "lucide-react";
import { useQuiz, QuizQuestion } from "@/context/QuizContext"; // Import QuizQuestion
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const QuizResults = () => {
  const { activeQuiz, setActiveQuiz, setQuizPhase, handleCreateNewQuiz } = useQuiz();
  const isMobile = useIsMobile();
  
  if (!activeQuiz || !activeQuiz.score) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8E9196]">No quiz results available.</p>
      </div>
    );
  }
  
  const { score } = activeQuiz;
  const incorrectQuestions = score.incorrectQuestions || [];
  
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A", message: "Excellent!" };
    if (percentage >= 80) return { grade: "B", message: "Great job!" };
    if (percentage >= 70) return { grade: "C", message: "Good work!" };
    if (percentage >= 60) return { grade: "D", message: "You passed!" };
    return { grade: "F", message: "Keep studying!" };
  };
  
  const { grade, message } = getGrade(score.percentage);
  const handleRetakeQuiz = () => {
    // Reset all question answers
    const resetQuestions = activeQuiz.questions.map(q => ({
      ...q,
      userAnswer: undefined
    }));
    
    // Create completely reset quiz with no progress
    const resetQuiz = {
      ...activeQuiz,
      questions: resetQuestions,
      score: undefined,
      progress: {
        currentQuestionIndex: 0, // Explicitly reset to first question
        timeRemaining: undefined
      }
    };
    
    // Clear sessionStorage progress for this quiz
    if (activeQuiz.id) {
      try {
        const progressMap = JSON.parse(sessionStorage.getItem('quiz-temp-progress') || '{}');
        delete progressMap[activeQuiz.id];
        sessionStorage.setItem('quiz-temp-progress', JSON.stringify(progressMap));
      } catch (error) {
        console.error('Error clearing quiz progress:', error);
      }
    }
      // Update context with reset quiz and switch to taking phase
    setActiveQuiz(resetQuiz);
    setQuizPhase("taking");
    
    // Provide feedback to user
    toast.success("Quiz reset! Starting from question 1.");
  };

  // Helper function to format answers for display
  const formatAnswer = (question: QuizQuestion, answer: string) => { // Use QuizQuestion type
    // For multiple choice questions, try to find the corresponding option text
    if (question.type === "multiple" && question.options && question.options.length > 0) {
      // Check if answer is an index and within valid range
      const index = parseInt(answer);
      if (!isNaN(index) && index >= 0 && index < question.options.length) {
        return question.options[index];
      }
    }
    return answer;
  };

  return (
    <div className="space-y-6">
      <Card className="neo-border bg-gradient-to-br from-[#E5DEFF] to-white overflow-hidden">
        <div className="bg-[#9b87f5] p-4 sm:p-6 neo-border-b">
          <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-white`}>Quiz Results</h2>
        </div>
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex flex-col items-center sm:items-start">
              <h3 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold mb-2 text-center sm:text-left`}>{activeQuiz.title}</h3>
              <p className="text-[#8E9196] text-sm sm:text-base">
                Completed on {new Date(score.completedDate || "").toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`${isMobile ? "text-4xl" : "text-6xl"} font-bold font-mono text-[#9b87f5] bg-white neo-border shadow-neo px-4 py-2 sm:px-6 sm:py-4 rotate-2`}>
                {grade}
              </div>
              <div className="text-base sm:text-lg font-medium text-[#8E9196] mt-2">{message}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="neo-border bg-white p-4 sm:p-6 text-center transform hover:rotate-2 transition-transform">
              <div className={`${isMobile ? "text-3xl" : "text-4xl"} font-mono font-bold text-[#9b87f5]`}>{Math.round(score.percentage)}%</div>
              <div className="text-base sm:text-lg text-[#8E9196] mt-2">Score</div>
            </div>
            <div className="neo-border bg-[#E5DEFF] p-4 sm:p-6 text-center transform hover:-rotate-2 transition-transform">
              <div className={`${isMobile ? "text-3xl" : "text-4xl"} font-mono font-bold text-green-500`}>{score.correct}</div>
              <div className="text-base sm:text-lg text-[#8E9196] mt-2">Correct</div>
            </div>
            <div className="neo-border bg-white p-4 sm:p-6 text-center transform hover:rotate-2 transition-transform">
              <div className={`${isMobile ? "text-3xl" : "text-4xl"} font-mono font-bold text-red-500`}>{score.total - score.correct}</div>
              <div className="text-base sm:text-lg text-[#8E9196] mt-2">Incorrect</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-end">
            <Button
              variant="outline"
              onClick={handleRetakeQuiz}
              className="neo-border bg-white shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Retake Quiz
            </Button>
            <Button
              onClick={handleCreateNewQuiz}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm"
            >
              <PenSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Create New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {incorrectQuestions.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <h3 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold flex items-center gap-2`}>
            <X className="text-red-500" />
            Review Incorrect Answers
          </h3>
          
          {incorrectQuestions.map((question, index) => (
            <Card key={index} className="neo-border overflow-hidden">
              <div className="bg-[#E5DEFF] p-4 sm:p-6 neo-border-b flex items-start justify-between">
                <h4 className={`${isMobile ? "text-base" : "text-xl"} font-bold pr-2`}>{question.question}</h4>
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 ml-2" />
              </div>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <div className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Your answer:</div>
                  <div className="neo-border bg-red-50 p-3 sm:p-4 text-sm sm:text-base">
                    {question.userAnswer ? formatAnswer(question, question.userAnswer) : "No answer provided"}
                  </div>
                </div>
                
                <div>
                  <div className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Correct answer:</div>
                  <div className="neo-border bg-green-50 p-3 sm:p-4 flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                    {formatAnswer(question, question.answer)}
                  </div>
                </div>
                
                {question.explanation && (
                  <div>
                    <div className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Explanation:</div>
                    <div className="neo-border bg-[#E5DEFF] p-3 sm:p-4 text-xs sm:text-sm">
                      {question.explanation}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizResults;
