import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ArrowLeft, Save } from "lucide-react";
import { Quiz, useQuiz } from "@/context/QuizContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useUserProfile } from "@/hooks/useUserProfile";

const QuizTaking = () => {
  const { 
    activeQuiz, 
    setActiveQuiz, 
    saveQuiz, 
    setQuizPhase, 
    handleCreateNewQuiz,
    saveProgress,
    loadProgress
  } = useQuiz();
  
  const { trackQuizTaken } = useUserProfile();

  // Stabilized getInitialQuestionIndex to prevent unnecessary callback recreations
  const getInitialQuestionIndex = useCallback(() => {
    if (activeQuiz?.progress?.currentQuestionIndex !== undefined) {
      return activeQuiz.progress.currentQuestionIndex;
    }
    const savedProgress = activeQuiz?.id ? loadProgress(activeQuiz.id) : undefined;
    return savedProgress || 0;
  }, [activeQuiz?.id, activeQuiz?.progress?.currentQuestionIndex, loadProgress]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => 
    activeQuiz?.progress?.currentQuestionIndex ?? 0
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [quizTitle, setQuizTitle] = useState(activeQuiz?.title || "");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Optimize currentQuestion memoization to prevent cascading re-renders
  const currentQuestion = useMemo(() => {
    if (!activeQuiz?.questions || currentQuestionIndex >= activeQuiz.questions.length) {
      return null;
    }
    return activeQuiz.questions[currentQuestionIndex];
  }, [activeQuiz?.questions, currentQuestionIndex]);

  // Optimized updateAnswer function to eliminate state cascade and reduce flickering
  const updateAnswer = useCallback((answer: string) => {
    if (!activeQuiz || !currentQuestion) return;
    
    // Single state update with batched changes to prevent cascade
    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      userAnswer: answer
    };
    
    const updatedQuiz = {
      ...activeQuiz,
      questions: updatedQuestions
    };
    
    setActiveQuiz(updatedQuiz);

    // Auto-advance logic with proper state batching - only for non-identification questions
    if (currentQuestionIndex < activeQuiz.questions.length - 1 && 
        currentQuestion.type !== "identification") {
      // Use React's batching to prevent multiple re-renders
      setIsTransitioning(true);
      
      // Use requestAnimationFrame for smoother transition without race conditions
      requestAnimationFrame(() => {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setIsTransitioning(false);
        }, 150); // Reduced timeout for better UX
      });
    }
  }, [activeQuiz, currentQuestionIndex, currentQuestion, setActiveQuiz]);

  // Optimized useEffect to prevent circular dependencies and reduce re-renders
  // Only reset question index when activeQuiz ID changes (new quiz) or on initial load
  useEffect(() => {
    if (activeQuiz?.id) {
      const initialIndex = getInitialQuestionIndex();
      // Only update if the index actually needs to change to prevent unnecessary re-renders
      if (initialIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(initialIndex);
      }
    }
  }, [activeQuiz?.id]); // Removed activeQuiz from dependencies to prevent cascade
  
  // Optimized progress saving - only save when question index actually changes
  useEffect(() => {
    if (activeQuiz?.id && currentQuestionIndex >= 0) {
      // Use a ref to prevent circular updates
      const timeoutId = setTimeout(() => {
        saveProgress(activeQuiz.id, currentQuestionIndex);
      }, 100); // Debounce progress saving
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentQuestionIndex, activeQuiz?.id, saveProgress]);

  // Early return after all hooks
  if (!activeQuiz || !activeQuiz.questions.length) {
    return <div className="text-center py-12">
      <p className="text-[#8E9196]">No quiz is currently available to take.</p>
      <Button 
        onClick={handleCreateNewQuiz}
        className="mt-4 bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Quiz Maker
      </Button>
    </div>;
  }

  const { questions } = activeQuiz;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuestion.userAnswer) {
      toast.error("Please answer the current question before proceeding");
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!currentQuestion.userAnswer) {
      toast.error("Please answer the current question before submitting");
      return;
    }
    
    // Fix: safely compare answers by converting to strings first
    const correctCount = activeQuiz.questions.filter(
      q => {
        if (!q.userAnswer) return false;
        
        // Convert both values to strings before comparison
        const userAnswerStr = String(q.userAnswer).toLowerCase();
        const correctAnswerStr = String(q.answer).toLowerCase();
        
        return userAnswerStr === correctAnswerStr;
      }
    ).length;
    
    // Similarly, update the incorrectQuestions filter
    const incorrectQuestions = activeQuiz.questions.filter(
      q => {
        if (!q.userAnswer) return true;
        
        // Convert both values to strings before comparison
        const userAnswerStr = String(q.userAnswer).toLowerCase();
        const correctAnswerStr = String(q.answer).toLowerCase();
        
        return userAnswerStr !== correctAnswerStr;
      }
    );
    
    const updatedQuiz: Quiz = {
      ...activeQuiz,
      score: {
        correct: correctCount,
        total: activeQuiz.questions.length,
        percentage: (correctCount / activeQuiz.questions.length) * 100,
        completed: true,
        completedDate: new Date().toISOString(),
        incorrectQuestions
      }
    };
    
    setActiveQuiz(updatedQuiz);
    setQuizPhase("results");
    
    // Track quiz completion achievement
    const percentage = (correctCount / activeQuiz.questions.length) * 100;
    trackQuizTaken(percentage); // Pass the score percentage
    
    toast.success("Quiz completed! Check your results.");
    
    // Clear saved progress when quiz is completed
    if (activeQuiz.id) {
      try {
        const progressMap = JSON.parse(sessionStorage.getItem('quiz-temp-progress') || '{}');
        delete progressMap[activeQuiz.id];
        sessionStorage.setItem('quiz-temp-progress', JSON.stringify(progressMap));
      } catch (error) {
        console.error('Error clearing quiz progress:', error);
      }
    }
  };

  const handleSaveQuiz = () => {
    if (!quizTitle.trim()) {
      toast.error("Please enter a title for your quiz");
      return;
    }
    
    const quizToSave: Quiz = {
      ...activeQuiz,
      title: quizTitle,
      questions: activeQuiz.questions.map(q => ({
        ...q,
        userAnswer: undefined
      })),
      score: undefined
    };
    
    saveQuiz(quizToSave);
    setShowSaveDialog(false);
    toast.success("Quiz saved successfully! You can retake it anytime.");
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case "multiple":
        return (
          <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <RadioGroup 
              value={currentQuestion.userAnswer || ""}
              onValueChange={updateAnswer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
            >
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, index) => (
                  <div 
                    key={index} 
                    className="relative border-2 border-[#1A1F2C] p-4 rounded-lg hover:bg-[#F8F5FF] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#1A1F2C]"
                  >
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b87f5]"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="block pl-8 cursor-pointer font-bold text-lg break-words"
                    >
                      {option}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-red-500">No options available for this question.</div>
              )}
            </RadioGroup>
          </div>
        );
        
      case "truefalse":
        return (
          <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <RadioGroup 
              value={currentQuestion.userAnswer || ""}
              onValueChange={updateAnswer}
              className="space-y-3 mt-4"
            >
              <div className="flex items-center space-x-2 border-2 border-[#D6BCFA] p-3 rounded-lg hover:bg-[#F8F5FF]">
                <RadioGroupItem value="True" id="option-true" className="text-[#9b87f5]" />
                <Label htmlFor="option-true" className="flex-grow cursor-pointer font-medium">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2 border-2 border-[#D6BCFA] p-3 rounded-lg hover:bg-[#F8F5FF]">
                <RadioGroupItem value="False" id="option-false" className="text-[#9b87f5]" />
                <Label htmlFor="option-false" className="flex-grow cursor-pointer font-medium">
                  False
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
        
      case "identification":
        return (
          <div className="mt-4">
            <Input
              value={currentQuestion.userAnswer || ""}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="border-2 border-[#D6BCFA] focus:border-[#9b87f5]"
            />
          </div>
        );
        
      case "statementTrueFalse":
        return (
          <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            <RadioGroup 
              value={currentQuestion.userAnswer || ""}
              onValueChange={updateAnswer}
              className="space-y-3 mt-4"
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center border-2 border-[#D6BCFA] p-3 rounded-lg hover:bg-[#F8F5FF]">
                  <RadioGroupItem 
                    value={option} 
                    id={`option-st-${index}`} 
                    className="text-[#9b87f5] mr-2"
                  />
                  <Label 
                    htmlFor={`option-st-${index}`} 
                    className="flex-grow cursor-pointer font-medium break-words"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button
          variant="outline"
          onClick={handleCreateNewQuiz}
          className="neo-border bg-white shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm h-8 sm:h-10"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Back
        </Button>
        <div className="text-xs sm:text-sm font-bold text-[#1A1F2C]">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSaveDialog(true)}
          className="neo-border bg-white shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm h-8 sm:h-10"
        >
          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Save
        </Button>
      </div>

      <Progress value={progress} className="h-1.5 sm:h-2 bg-[#E5DEFF]" />

      <Card className="neo-border bg-white shadow-neo overflow-hidden">
        <CardContent className="p-3 sm:p-6">
          <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 break-words">{currentQuestion.question}</h3>
          
          {renderQuestionContent()}
          
          <div className="flex justify-between mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="neo-border bg-white shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm h-8 sm:h-10"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={handleNextQuestion}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm h-8 sm:h-10"
              >
                Next
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs sm:text-sm h-8 sm:h-10"
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="border-2 border-[#D6BCFA]">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Save this quiz to take it again later. Your current progress won't be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Quiz Title"
              className="border-2 border-[#D6BCFA] focus:border-[#9b87f5]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-2 border-[#D6BCFA] hover:bg-[#E5DEFF]"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-[#9b87f5] hover:bg-[#7E69AB] border-2 border-[#6E59A5]"
              onClick={handleSaveQuiz}
            >
              Save Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizTaking;
