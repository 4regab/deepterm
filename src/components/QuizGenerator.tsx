
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quiz Generator</h2>
        <Textarea
          value={studyMaterial}
          onChange={(e) => setStudyMaterial(e.target.value)}
          placeholder="Enter your study material here..."
          className="h-40"
        />
        <Button onClick={handleGenerateQuiz} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Generated Questions</h3>
          {questions.map((question) => (
            <Card key={question.id} className="p-4 space-y-2">
              <p className="font-medium">{question.question}</p>
              {question.options.length > 0 && (
                <ul className="space-y-1">
                  {question.options.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
              )}
              <p className="text-green-600">Answer: {question.answer}</p>
              <p className="text-gray-600 text-sm">{question.explanation}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
