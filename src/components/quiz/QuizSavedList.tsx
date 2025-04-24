import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Calendar, Play, Trash2, BarChart, Edit } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

const QuizSavedList = () => {
  const { savedQuizzes, loadQuiz, deleteQuiz, setActiveQuiz, setQuizPhase } = useQuiz();
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [quizToEdit, setQuizToEdit] = useState<string | null>(null);
  
  const handleDeleteClick = (quizId: string) => {
    setQuizToDelete(quizId);
  };

  const handleEditClick = (quizId: string) => {
    setQuizToEdit(quizId);
  };
  
  const confirmEdit = () => {
    if (!quizToEdit) return;
    
    const quizToEditObj = savedQuizzes.find(quiz => quiz.id === quizToEdit);
    
    if (quizToEditObj) {
      setActiveQuiz(quizToEditObj);
      setQuizPhase("creation");
      toast.success(`Now editing "${quizToEditObj.title}"`);
      setQuizToEdit(null);
    } else {
      toast.error("Could not find the quiz to edit");
    }
  };
  
  const confirmDelete = () => {
    if (quizToDelete) {
      deleteQuiz(quizToDelete);
      setQuizToDelete(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-[#9b87f5] p-6 border-b-4 border-black">
          <h2 className="font-black text-2xl flex items-center gap-3 text-white">
            <Book className="w-7 h-7" />
            Saved Quizzes
          </h2>
        </div>
        
        <CardContent className="p-6">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl font-bold mb-2">No saved quizzes yet</p>
              <p className="px-4 py-2 bg-[#FFDEE2] inline-block border-2 border-black">Create a quiz and save it to see it here</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {savedQuizzes.map((quiz) => (
                <li key={quiz.id} className="border-4 border-black p-4 hover:bg-[#FFDEE2] transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg truncate max-w-[70%]">{quiz.title}</h3>
                      {quiz.score?.completed && (
                        <span className="text-sm bg-black text-white px-3 py-1 -rotate-2 flex items-center font-bold">
                          <BarChart className="w-3 h-3 mr-1" />
                          {Math.round(quiz.score.percentage)}%
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-[#8E9196] flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(quiz.lastModified)}
                      <span className="mx-2">•</span>
                      {quiz.questions.length} questions
                    </div>
                    
                    <div className="flex justify-between gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadQuiz(quiz.id)}
                        className="flex-1 border border-[#D6BCFA] hover:bg-[#E5DEFF] text-xs h-8"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {quiz.score?.completed ? "View Results" : "Take Quiz"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(quiz.id)}
                        className="border border-blue-200 hover:bg-blue-50 hover:text-blue-500 text-blue-400 h-8 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(quiz.id)}
                        className="border border-red-200 hover:bg-red-50 hover:text-red-500 text-red-400 h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black -rotate-2">Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription className="text-lg mt-4 border-2 border-black bg-[#FFDEE2] p-3">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="flex-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="flex-1 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!quizToEdit} onOpenChange={(open) => !open && setQuizToEdit(null)}>
        <AlertDialogContent className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black -rotate-2">Edit Quiz</AlertDialogTitle>
            <AlertDialogDescription className="text-lg mt-4 border-2 border-black bg-[#E5DEFF] p-3">
              You're about to edit this quiz. You can modify the title, study material, and other settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="flex-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmEdit}
              className="flex-1 bg-[#9b87f5] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
            >
              Edit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizSavedList;
