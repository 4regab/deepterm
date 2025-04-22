import React, { useState, useEffect } from 'react';
import { useQuiz } from '@/pages/Quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, ListChecks, Save } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { QuizGenerator } from '@/services/quizGenerator';
import { API_KEY_STORAGE_KEY } from '@/components/shared/ApiKeyInput';
import { useUserProfile } from '@/context/UserProfileContext';

const QuizCreation = () => {
  const { 
    activeQuiz, 
    setActiveQuiz, 
    isGenerating, 
    setIsGenerating,
    setQuizPhase, 
    saveQuiz 
  } = useQuiz();
  
  const { trackQuizCreated } = useUserProfile();
  
  const [studyMaterial, setStudyMaterial] = useState(activeQuiz?.studyMaterial || '');
  const [title, setTitle] = useState(activeQuiz?.title || 'Untitled Quiz');

  useEffect(() => {
    setTitle(activeQuiz?.title || 'Untitled Quiz');
    setStudyMaterial(activeQuiz?.studyMaterial || '');
  }, [activeQuiz]);

  const handleGenerate = async () => {
    if (!studyMaterial.trim()) {
      toast.error("Please provide some study material.");
      return;
    }

    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
      toast.error("API Key required to generate quiz.");
      return;
    }

    const updatedQuiz = { 
      ...activeQuiz, 
      id: activeQuiz?.id || uuidv4(),
      title: title, 
      studyMaterial: studyMaterial,
      lastModified: new Date().toISOString(),
      dateCreated: activeQuiz?.dateCreated || new Date().toISOString(),
      settings: activeQuiz?.settings || { 
        questionType: "multiple",
        numberOfQuestions: 5,
        verbatimMode: true
      }
    };
    setActiveQuiz(updatedQuiz);
    
    try {
      setIsGenerating(true);
      
      const generator = new QuizGenerator(apiKey);
      
      const result = await generator.extractAndGenerateQuiz(
        studyMaterial,
        updatedQuiz.settings?.numberOfQuestions || 5,
        updatedQuiz.settings?.questionType || "multiple",
        updatedQuiz.settings?.verbatimMode ?? true
      );
      
      if (!result || !result.success) {
        toast.error(result?.error || "Failed to generate quiz");
        return;
      }

      if (!result.questions || result.questions.length === 0) {
        toast.error("No questions could be generated. Try with different study material.");
        return;
      }

      const convertedQuestions = result.questions.map(q => ({
        id: String(q.id || uuidv4()),
        question: q.question || "Question unavailable",
        options: q.options || [],
        answer: q.answer || "",
        explanation: q.explanation || "",
        type: q.type || updatedQuiz.settings?.questionType || "multiple"
      }));
      
      const newQuiz = {
        ...updatedQuiz,
        questions: convertedQuestions
      };
      
      setActiveQuiz(newQuiz);
      toast.success(`Generated ${convertedQuestions.length} questions successfully!`);
      
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setTitle(newTitle);
    if (activeQuiz) {
      setActiveQuiz({ ...activeQuiz, title: newTitle });
    }
  };
  
  const handleSave = () => {
     if (!activeQuiz) {
       toast.error("No active quiz to save.");
       return;
     }
     const quizToSave = { 
        ...activeQuiz, 
        title: title,
        studyMaterial: studyMaterial,
        lastModified: new Date().toISOString() 
     };
     saveQuiz(quizToSave);
     toast.success(`Quiz "${quizToSave.title}" saved!`);
     trackQuizCreated();
  }

  return (
    <div className="space-y-6">
      <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
         <div className="bg-[#E5DEFF] p-6 border-b-4 border-black">
           <h2 className="font-black text-2xl flex items-center gap-3">
             <Wand2 className="w-7 h-7 text-[#9b87f5]" />
             Create Your Quiz
           </h2>
         </div>
         <CardContent className="p-6 space-y-4">
           <div>
             <Label htmlFor="study-material" className="text-lg font-bold block mb-2">Study Material</Label>
             <Textarea
               id="study-material"
               placeholder="Paste your notes, text, or topic here..."
               value={studyMaterial}
               onChange={(e) => setStudyMaterial(e.target.value)}
               className="min-h-[150px] border-2 border-black focus:border-[#9b87f5] focus:ring-[#9b87f5]"
               disabled={isGenerating}
             />
             <p className="text-xs text-[#8E9196] mt-1">The AI will generate questions based on this content.</p>
           </div>
           <Button 
             onClick={handleGenerate} 
             disabled={isGenerating || !studyMaterial.trim()}
             className="w-full bg-[#9b87f5] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#7E69AB] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isGenerating ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
               </>
             ) : (
               'Generate Quiz Questions'
             )}
           </Button>
         </CardContent>
       </Card>

      {activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0 && !isGenerating && (
        <Card className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-[#FFDEE2] p-6 border-b-4 border-black">
            <h2 className="font-black text-2xl flex items-center gap-3">
              <ListChecks className="w-7 h-7 text-red-500" />
              Review Your Quiz Questions
            </h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="quiz-title" className="text-lg font-bold block mb-2">Quiz Title</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter quiz title"
                className="border-2 border-black focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <ul className="space-y-3 max-h-[300px] overflow-y-auto border-2 border-dashed border-gray-300 p-3">
              {activeQuiz.questions.map((q, index) => (
                <li key={index} className="text-sm">
                  <strong>{index + 1}.</strong> {q.question} 
                </li>
              ))}
            </ul>
            
             <div className="flex gap-4">
                 <Button 
                   onClick={handleSave} 
                   variant="outline"
                   className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold" 
                 >
                   <Save className="mr-2 h-4 w-4" /> Save Quiz
                 </Button>
             </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizCreation;
