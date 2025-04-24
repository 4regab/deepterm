import { useState, useEffect } from "react";
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
import { useUserProfile } from "@/context/UserProfileContext"; // Import user profile context

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
  
  // Add user profile context for achievement tracking
  const { trackQuizTaken } = useUserProfile(); // Removed trackPerfectScore
  
  // Initialize from saved progress if available
  const initialQuestionIndex = activeQuiz?.progress?.currentQuestionIndex || 0;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [quizTitle, setQuizTitle] = useState(activeQuiz?.title || "");
  
  // Save progress whenever the current question index changes
  useEffect(() => {
    if (activeQuiz?.id) {
      saveProgress(activeQuiz.id, currentQuestionIndex);
    }
  }, [currentQuestionIndex, activeQuiz?.id, saveProgress]);
  
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
  const currentQuestion = questions[currentQuestionIndex];
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

  const updateAnswer = (answer: string) => {
    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      userAnswer: answer
    };
    
    setActiveQuiz({
      ...activeQuiz,
      questions: updatedQuestions
    });

    // Only auto-advance for multiple choice, truefalse, and statementTrueFalse
    // Don't auto-advance for identification questions
    if (currentQuestionIndex < questions.length - 1 && 
        currentQuestion.type !== "identification") {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 500);
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
        );
        
      case "truefalse":
        return (
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
