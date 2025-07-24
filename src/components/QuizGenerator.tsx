
import React, { useState } from 'react';
import { generateQuiz } from '../services/quizGenerator';
import { QuizQuestion } from '../types/quiz';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface Props {
  apiKey: string;
}

export function QuizGeneratorComponent({ apiKey }: Props) {
  const [studyMaterial, setStudyMaterial] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!studyMaterial.trim()) {
      toast.error('Please enter study material');
      return;
    }

    setLoading(true);

    try {
      // Extract topic from study material
      const topic = studyMaterial.length > 50 
        ? studyMaterial.substring(0, 50) + "..." 
        : studyMaterial;
        
      const result = await generateQuiz(apiKey, topic, "medium", 5);
      
      if (Array.isArray(result)) {
        // Map the result to match our QuizQuestion type
        const formattedQuestions = result.map((q, index) => ({
          id: index.toString(),
          type: "multiple" as const,
          question: q.question,
          options: q.options,
          answer: q.answer.toString(),
          explanation: q.explanation
        }));
        
        setQuestions(formattedQuestions);
        toast.success('Quiz generated successfully!');
      } else {
        toast.error('Failed to generate quiz');
      }
    } catch (error) {
      toast.error('An error occurred while generating the quiz');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neo-black">Quiz Generator</h2>
        <Textarea
          value={studyMaterial}
          onChange={(e) => setStudyMaterial(e.target.value)}
          placeholder="Enter your study material here..."
          className="min-h-[120px] sm:h-40 lg:h-48 text-sm sm:text-base neo-border focus:ring-2 focus:ring-neo-accent3 rounded-lg resize-y"
        />
        <Button 
          onClick={handleGenerateQuiz} 
          disabled={loading}
          className="w-full sm:w-auto font-bold neo-border bg-neo-accent text-neo-black hover:bg-neo-accent/90 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg py-3 px-6 text-sm sm:text-base min-h-[44px] touch-target"
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-neo-black">Generated Questions</h3>
          {questions.map((question) => (
            <Card key={question.id} className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 neo-border shadow-neo bg-white rounded-lg border-2 border-neo-black">
              <p className="font-medium text-sm sm:text-base lg:text-lg text-neo-black leading-relaxed">{question.question}</p>
              {question.options.length > 0 && (
                <ul className="space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                  {question.options.map((option, index) => (
                    <li key={index} className="text-xs sm:text-sm lg:text-base text-neo-black before:content-['•'] before:mr-2 before:text-neo-accent">
                      {option}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-green-600 font-medium text-xs sm:text-sm lg:text-base">
                <span className="font-bold">Answer:</span> {question.answer}
              </p>
              <p className="text-neo-muted text-xs sm:text-sm leading-relaxed bg-neo-bg p-2 sm:p-3 rounded-lg neo-border">
                <span className="font-medium text-neo-black">Explanation:</span> {question.explanation}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
