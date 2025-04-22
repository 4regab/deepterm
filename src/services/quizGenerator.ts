import GeminiCore from "./geminiCore";
import { QuizGenerationResponse, QuizQuestion } from "../types/quiz";
import { v4 as uuidv4 } from "uuid";
import { ExtractionMode, extractKeyTerms, initializeGemini } from "./geminiService";
import { ExtractionResult, KeyTerm } from "@/types";

// Constants - using the same API key name as in ApiKeyInput.tsx
const API_KEY_STORAGE_KEY = 'gemini-api-key';

export class QuizGenerator extends GeminiCore {
  constructor(apiKey?: string) {
    // First try to use the provided API key if available
    if (apiKey) {
      super(apiKey);
      // Also initialize geminiService with this key
      initializeGemini(apiKey);
      return;
    }
    
    // Otherwise, try to load from localStorage if we're in a browser environment
    let localStorageKey = "";
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorageKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
      console.log("Retrieved API key from localStorage:", localStorageKey ? "Key found" : "No key found");
    }
    
    super(localStorageKey);
    
    // Also initialize the geminiService with this key
    if (localStorageKey) {
      initializeGemini(localStorageKey);
    }
  }

  async extractAndGenerateQuiz(
    studyMaterial: string,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false
  ): Promise<QuizGenerationResponse> {
    try {
      // Check if we have a valid API key
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (!storedKey) {
          return { 
            success: false, 
            error: "No API key found. Please set your Gemini API key in the settings." 
          };
        }
        
        // Re-initialize with the stored key to ensure it's set
        initializeGemini(storedKey);
      }
      
      // First extract all key terms from the study material
      const extractionResult = await extractKeyTerms(studyMaterial, "full");
      
      // Auto-determine number of questions if needed
      if (numQuestions === undefined) {
        numQuestions = this.determineOptimalQuestionCount(extractionResult);
      }
      
      // Use the extracted key terms to generate a better quiz
      return this.generateQuizFromExtractedTerms(extractionResult, numQuestions, quizType, verbatim);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process text";
      console.error("Error in extract and generate quiz:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private determineOptimalQuestionCount(extractionResult: ExtractionResult): number {
    // Count all meaningful terms, including main terms, subcategories, and examples
    const allMeaningfulTerms = this.getAllMeaningfulTerms(extractionResult);
    const totalMeaningfulTerms = allMeaningfulTerms.length;
    
    console.log(`Total meaningful terms identified for quiz: ${totalMeaningfulTerms}`);
    
    // IMPROVED: Ensure we generate enough questions to cover most or all terms
    // For larger sets, we want to cover at least 80-90% of terms
    let questionCount: number;
    
    if (totalMeaningfulTerms === 0) {
      // Fallback if no terms were identified
      questionCount = 10;
    } else if (totalMeaningfulTerms <= 5) {
      // For very few terms, use at least 2 questions per term
      questionCount = totalMeaningfulTerms * 2;
    } else if (totalMeaningfulTerms <= 15) {
      // For small sets, use at least 1.5 questions per term to ensure coverage
      questionCount = Math.ceil(totalMeaningfulTerms * 1.5);
    } else if (totalMeaningfulTerms <= 30) {
      // For medium sets, ensure we cover at least 90% of terms
      questionCount = Math.ceil(totalMeaningfulTerms * 0.9);
    } else if (totalMeaningfulTerms <= 50) {
      // For larger sets, ensure we cover at least 85% of terms
      questionCount = Math.ceil(totalMeaningfulTerms * 0.85);
    } else {
      // For very large sets, ensure we cover at least 80% of terms
      questionCount = Math.ceil(totalMeaningfulTerms * 0.8);
    }
    
    // Ensure we have a reasonable number, but raise the maximum to better handle larger term sets
    questionCount = Math.max(10, Math.min(Math.round(questionCount), 100));
    
    console.log(`Auto-determined question count: ${questionCount} to cover ${totalMeaningfulTerms} terms`);
    return questionCount;
  }

  // Helper method to extract all meaningful terms (main terms, subcategories, examples) that have definitions
  private getAllMeaningfulTerms(extractionResult: ExtractionResult): Array<{term: string, meaning: string}> {
    const allTerms: Array<{term: string, meaning: string}> = [];
    
    // Process each main key term
    extractionResult.keyTerms.forEach(term => {
      // Add main term if it has a meaning
      if (term.term && term.meaning) {
        allTerms.push({
          term: term.term,
          meaning: term.meaning
        });
      }
      
      // Process subcategories if they exist
      if (term.subcategories && Array.isArray(term.subcategories) && term.subcategories.length > 0) {
        // For subcategories, we'll use the main term's meaning as context
        term.subcategories.forEach(subcat => {
          if (subcat && subcat.trim()) {
            allTerms.push({
              term: subcat,
              meaning: `${subcat} is a subcategory of ${term.term}. ${term.meaning}`
            });
          }
        });
      }
      
      // Process examples if they exist
      if (term.examples && Array.isArray(term.examples) && term.examples.length > 0) {
        // For examples, we'll use the main term for context
        term.examples.forEach(example => {
          if (example && example.trim()) {
            allTerms.push({
              term: example,
              meaning: `${example} is an example of ${term.term}. ${term.meaning}`
            });
          }
        });
      }
    });
    
    return allTerms;
  }

  async generateQuizFromExtractedTerms(
    extractionResult: ExtractionResult,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false
  ): Promise<QuizGenerationResponse> {
    // Get all meaningful terms including main terms, subcategories, and examples
    const allMeaningfulTerms = this.getAllMeaningfulTerms(extractionResult);
    
    // Create a formatted study material from all extracted meaningful terms
    let formattedMaterial = "";
    
    // Add title
    formattedMaterial += `${extractionResult.title}\n\n`;
    
    // Include ALL meaningful terms with their meanings
    allMeaningfulTerms.forEach(item => {
      formattedMaterial += `${item.term} - ${item.meaning}\n\n`;
    });
    
    // Additionally, include the original hierarchical structure for context
    formattedMaterial += "\n--- Original Structure ---\n\n";
    extractionResult.keyTerms.forEach(term => {
      formattedMaterial += `${term.term} - ${term.meaning}\n`;
      
      // Include category if available
      if (term.category) {
        formattedMaterial += `Category: ${term.category}\n`;
      }
      
      // Include all subcategories with their title
      if (term.subcategories && term.subcategories.length > 0) {
        if (term.subcategoryTitle) {
          formattedMaterial += `${term.subcategoryTitle}:\n`;
        } else {
          formattedMaterial += `Subcategories:\n`;
        }
        term.subcategories.forEach(subcat => {
          formattedMaterial += `- ${subcat}\n`;
        });
      }
      
      // Include all examples
      if (term.examples && term.examples.length > 0) {
        formattedMaterial += `Examples:\n`;
        term.examples.forEach(example => {
          formattedMaterial += `- ${example}\n`;
        });
      }
      
      formattedMaterial += "\n";
    });
    
    console.log(`Creating quiz from ${allMeaningfulTerms.length} meaningful terms`);
    
    // Generate quiz using the enhanced formatted material
    return this.generateQuizQuestions(formattedMaterial, numQuestions, quizType, verbatim);
  }

  async generateQuizQuestions(
    studyMaterial: string,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false,
    sourceTerms?: Array<{ term: string, definition: string }>
  ): Promise<QuizGenerationResponse> {
    const questionCount = numQuestions ? `${numQuestions}` : "an appropriate number of";
    
    const verbatimInstruction = verbatim 
      ? `VERY IMPORTANT: Your task is to identify KEY TERMS and create fill-in-the-blank questions where the BLANK replaces the term, directly followed by the definition/explanation.

      HOW TO IDENTIFY KEY TERMS:
      - Look for bold or italicized terms
      - Look for numbered or bulleted items with a term followed by a dash (–) or colon (:)
      - Look for lines that start with a clear term followed by explanation
      - Look for section headings or subheadings that define concepts
      - YOU MUST INCLUDE ALL categories, subcategories, and examples as potential terms
      - YOU MUST CREATE QUESTIONS from ALL examples and types mentioned in the study material
      
      FORMAT YOUR QUESTIONS:
      1. For each term you identify, create a question like this:
         "__________ [EXACT explanation/definition that follows the term]"
      2. NEVER include any dash (–) or colon (:) between the blank and the text
      3. The blank must be directly followed by the explanation text
      4. DO NOT include the term in the question text
      
      CRUCIAL RULES:
      - The blank ALWAYS represents the key term
      - The text after the blank MUST be EXACT verbatim passages from the study material
      - DO NOT modify any words from the source material's explanation part
      - Pay special attention to lines that follow this pattern: "Term – explanation" or "Term : explanation"
      - For numbered or bulleted lists that define terms, use the term as the answer
      - YOU MUST CREATE QUESTIONS from ALL examples and categories - these are crucial for comprehensive coverage
      
      Examples:
      
      Source text: "Ethical relativism argues that moral values are shaped by social, cultural, and individual perspectives."
      
      CORRECT question: "__________ argues that moral values are shaped by social, cultural, and individual perspectives."
      CORRECT answer: "Ethical relativism"
      
      Source text: "Intentionality – The individual's intention behind an action is important in determining moral responsibility. Actions done with deliberate intent carry more moral weight than those done accidentally."
      
      CORRECT question: "__________ The individual's intention behind an action is important in determining moral responsibility. Actions done with deliberate intent carry more moral weight than those done accidentally."
      CORRECT answer: "Intentionality"
      
      Source text: "Eco-Friendly Packaging – Companies using biodegradable materials to reduce environmental impact."
      
      CORRECT question: "__________ Companies using biodegradable materials to reduce environmental impact."
      CORRECT answer: "Eco-Friendly Packaging"
      
      The ANSWER must ONLY be the key term that would fill in the blank.
      
      EXTREMELY IMPORTANT: Preserve the EXACT capitalization of the key terms as they appear in the source material. Do not lowercase or change any capitalization.
      
      NEVER TRUNCATE OR SPLIT THE TERM. If a term includes a dash (like "Term-Based Analysis"), keep the ENTIRE term as the answer.`
      : `Generate questions that test understanding of the concepts in the study material. Questions can rephrase or reframe the material to test deeper understanding. MOST IMPORTANTLY: INCLUDE ALL key terms, examples, subcategories, and concepts from the material in your question set - make sure every term has at least one question.`;
    
    const statementTrueFalseInstructions = quizType === "statementTrueFalse" || quizType === "mixed" 
      ? `
      For "Statement True/False" questions:
      - Create questions with TWO statements about the material
      - Label them clearly as "Statement 1:" and "Statement 2:"
      - Make sure each statement can be definitively evaluated as true or false
      - Use the standard options:
        A. The first statement is true, the second statement is false.
        B. The first statement is false, the second statement is true.
        C. Both statements are true.
        D. Both statements are false.
      - Make sure the answer is one of these four options
      `
      : "";
    
    const systemPrompt = `
      You are an expert quiz generator. Generate ${questionCount} quiz questions based on the study material provided.
      
      Quiz Type: ${quizType === "mixed" ? "Mix of Multiple Choice, True/False, Statement True/False, and Identification" : 
                   quizType === "multiple" ? "Multiple Choice" : 
                   quizType === "truefalse" ? "True/False" :
                   quizType === "statementTrueFalse" ? "Statement True/False" : 
                   "Identification"}
      
      ${verbatimInstruction}
      
      ${statementTrueFalseInstructions}
      
      ${numQuestions ? `IMPORTANT: You MUST generate EXACTLY ${numQuestions} questions, no more and no less.` : 
      `IMPORTANT: Generate a comprehensive set of questions that thoroughly covers the material provided.
       - For short materials (< 500 words), generate at least 10-15 questions
       - For medium materials (500-1500 words), generate at least 20-30 questions
       - For long materials (> 1500 words), generate at least 30-60 questions
       - ENSURE you cover ALL key concepts and important information in the material
       - CRITICAL: Do not skip any terms or sections of the content
       - YOU MUST include questions about EVERY example, subcategory, and concept that appears in the material
       - MAXIMIZE COVERAGE - you should aim to have at least one question about every term in the input`}

      SUPER IMPORTANT FOR VERBATIM QUESTIONS:
      - DO NOT create questions asking about the meaning or definition of a term
      - INSTEAD, the blank should BE the term itself, and what follows should be the explanation
      - Always format as: "__________ [explanation of the term]" (with NO dash or colon)
      - Looking for patterns like "Term – explanation" or "1. Term - explanation"
      - Never rewrite or paraphrase the explanation - use the EXACT text that follows the term
      - DO NOT include any dash or colon between the blank and the text that follows
      - Make sure the answer is the COMPLETE term - not just part of it
      - For example, if the term is "Eco-Friendly Packaging", the ENTIRE phrase must be the answer, not just "Eco-Friendly"
      - PRESERVE EXACT CAPITALIZATION of key terms as they appear in the source material
      
      CRITICAL INSTRUCTION: The material contains all terms and examples that were extracted. YOU MUST STRIVE TO INCLUDE AS MANY OF THESE TERMS AS POSSIBLE in your questions. Aim for maximum coverage of all terms.
      
      Format your response as a valid JSON array of quiz question objects with the following format:
      
      For Multiple Choice:
      {
        "id": 1,
        "type": "multiple",
        "question": "__________ [Term explanation from source]",
        "options": ["Term 1", "Term 2", "Term 3", "Term 4"],
        "answer": "Term 1",
        "explanation": "Explanation of the correct answer"
      }
      
      For True/False:
      {
        "id": 2,
        "type": "truefalse",
        "question": "__________ [Statement]",
        "options": ["True", "False"],
        "answer": "True",
        "explanation": "Explanation of why this is true"
      }
      
      For Statement True/False:
      {
        "id": 3,
        "type": "statementTrueFalse",
        "question": "Statement 1: [First statement]\\nStatement 2: [Second statement]",
        "options": [
          "A. The first statement is true, the second statement is false.",
          "B. The first statement is false, the second statement is true.",
          "C. Both statements are true.",
          "D. Both statements are false."
        ],
        "answer": "A. The first statement is true, the second statement is false.",
        "explanation": "Explanation of why the first statement is true and the second is false"
      }
      
      For Identification:
      {
        "id": 4,
        "type": "identification",
        "question": "__________ [Definition or description]",
        "answer": "The term",
        "options": [],
        "explanation": "Explanation of the answer"
      }
      
      IMPORTANT:
      1. Ensure proper escaping of special characters in JSON strings
      2. For verbatim questions, make sure the "answer" field contains the COMPLETE term (including any dashes or hyphens) that appears in the source material
      3. Only include information directly from the provided study material
      4. For multiple choice, all options should be terms from the source material
      5. Ensure the JSON is properly formatted with no syntax errors
      6. Do not wrap your response in markdown code blocks or backticks
      7. Your entire response should be a valid JSON array, nothing else
      8. Cover the FULL BREADTH of the study material - do not neglect any important sections
      9. Place EXACTLY ONE blank (________) at the beginning of EACH question without any dash or colon after it
      10. DO NOT use any quotation marks in the verbatim questions
      11. The "answer" field MUST contain the COMPLETE term that would fill in the blank, EXACTLY as it appears in the source
      12. PRESERVE EXACT CAPITALIZATION of key terms
      13. CRITICAL: Generate questions from EVERY section of the material - don't focus only on the beginning
      
      ONLY return the raw JSON array with no additional text.
    `;

    try {
      const result = await this.generateContent(studyMaterial, systemPrompt, {
        temperature: 0.7,
        maxOutputTokens: 100000,
        topK: 40,
        topP: 0.95
      });
      
      if (!result.success) {
        return { success: false, error: result.error || "API call failed" };
      }

      const responseText = result.data.candidates[0].content.parts[0].text.trim();
      console.log("Raw API response (first 500 chars):", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));
      console.log("Raw API response length:", responseText.length);
      
      let jsonString = responseText;
      
      jsonString = jsonString.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      
      const arrayMatch = jsonString.match(/(\[[\s\S]*\])/);
      if (arrayMatch && arrayMatch[1]) {
          jsonString = arrayMatch[1];
          console.log("Extracted JSON array structure.");
      } else {
          const objectMatch = jsonString.match(/(\{[\s\S]*\})/);
          if (objectMatch && objectMatch[1]) {
              jsonString = objectMatch[1];
              console.warn("Extracted JSON object structure instead of array.");
          } else {
              console.warn("Could not reliably extract JSON array/object structure. Proceeding with the full string, which might cause parsing errors.");
          }
      }
      
      console.log("Cleaned JSON string (first 500 chars):", jsonString.substring(0, 500) + (jsonString.length > 500 ? "..." : ""));
      console.log("Cleaned JSON string length:", jsonString.length);
      
      let questions;
      try {
        questions = JSON.parse(jsonString);
        console.log("Successfully parsed JSON on first attempt.");
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? error.message : String(parseError);
        console.error("Initial JSON parse error:", errorMessage);
        if (errorMessage.includes('position')) {
            const positionMatch = errorMessage.match(/position (\d+)/);
            if (positionMatch && positionMatch[1]) {
                const errorPos = parseInt(positionMatch[1], 10);
                const contextWindow = 50;
                const errorContext = jsonString.substring(Math.max(0, errorPos - contextWindow), Math.min(jsonString.length, errorPos + contextWindow));
                console.error(`Error near position ${errorPos}: ...${errorContext}...`);
            }
        }
        console.error("Attempting to fix JSON...");
        console.log("Problematic JSON string (first 1000 chars):", jsonString.substring(0, 1000) + (jsonString.length > 1000 ? "..." : ""));

        const errorToPass = parseError instanceof Error ? parseError : new Error(String(parseError));
        const fixedJson = this.attemptToFixJson(jsonString, errorToPass);
        if (fixedJson) {
          console.log("Successfully parsed JSON after fix attempt.");
          questions = fixedJson;
        } else {
          console.error("Failed to parse JSON even after fix attempts.");
          return {
            success: false,
            error: `Failed to parse the generated quiz response. The API might have returned invalid JSON. Original error: ${errorMessage}. Please check the study material for unusual formatting or try simplifying it.`
          };
        }
      }
      
      if (!Array.isArray(questions)) {
         if (typeof questions === 'object' && questions !== null) {
            console.warn("Parsed result was a single object, wrapping in an array.");
            questions = [questions];
         } else {
            console.error("Parsed result is not an array or object:", questions);
            return { success: false, error: "Parsed response is not a valid JSON array or object." };
         }
      }
      
      const validatedQuestions: QuizQuestion[] = questions.map((q: Record<string, unknown>, index: number) => {
        // Create base question
        const question: QuizQuestion = {
          id: (q.id as string | number) || uuidv4(),
          type: (q.type && ["multiple", "truefalse", "identification", "statementTrueFalse"].includes(q.type as string)) 
            ? q.type as "multiple" | "truefalse" | "identification" | "statementTrueFalse" 
            : quizType === "mixed" ? "multiple" : quizType, // Default to the requested quizType if type is invalid
          question: (q.question as string) || "Question unavailable",
          options: Array.isArray(q.options) ? q.options as string[] : [],
          answer: (q.answer as string) || "",
          explanation: (q.explanation as string) || "No explanation provided"
        };
        
        // Handle verbatim formatting
        if (verbatim) {
          question.question = question.question.replace(/["""''`]/g, '');
          question.question = question.question.replace(/^_+\s*[-–—:]\s*/, '__________ ');
          if (!question.question.trim().startsWith('__________')) {
            const dashMatch = question.question.match(/(.+?)[-–—:](.+)/);
            if (dashMatch) {
              question.question = `__________ ${dashMatch[2].trim()}`;
            } else {
              question.question = `__________ ${question.question.trim()}`;
            }
          }
          if (question.answer) {
            question.answer = question.answer.replace(/[.,;:!?]$/, '');
          }
        }
        
        // Ensure proper options for different question types
        if (question.type === "truefalse") {
          question.options = ["True", "False"];
        }
        
        if (question.type === "statementTrueFalse") {
          question.options = [
            "A. The first statement is true, the second statement is false.",
            "B. The first statement is false, the second statement is true.",
            "C. Both statements are true.",
            "D. Both statements are false."
          ];
          if (!question.options.includes(question.answer)) {
            question.answer = question.options[0];
          }
        }
        
        // Fix for multiple choice questions - ensure they always have at least 4 options
        if (question.type === "multiple") {
          const correctAnswer = (question.answer || "").trim(); // Ensure trimmed
          let potentialDistractors: string[] = [];
          console.log(`[MC Options] Q: ${question.question}, Answer: "${correctAnswer}"`); // Log

          // PRIORITIZE sourceTerms if available (manual input)
          if (sourceTerms && sourceTerms.length > 0) {
            console.log(`[MC Options] Using sourceTerms (count: ${sourceTerms.length})`); // Log
            potentialDistractors = sourceTerms
              .map(t => (t.term || "").trim()) // Ensure trimmed
              // Ensure distractors are strings, not empty, and not the correct answer (case-insensitive)
              .filter(term => term !== '' && term.toLowerCase() !== correctAnswer.toLowerCase());
            console.log(`[MC Options] Potential distractors from sourceTerms:`, potentialDistractors); // Log
          } else {
            // Fallback: Try to get distractors from other generated questions' answers (auto mode)
            console.log(`[MC Options] Using other questions' answers as distractors`); // Log
            potentialDistractors = questions
              .filter((oq: Record<string, unknown>) => oq.id !== q.id && typeof oq.answer === 'string' && (oq.answer as string).trim() !== '')
              .map((oq: Record<string, unknown>) => (oq.answer as string).trim()) // Ensure trimmed
              .filter((opt: string) => opt.toLowerCase() !== correctAnswer.toLowerCase());
             console.log(`[MC Options] Potential distractors from other answers:`, potentialDistractors); // Log
          }

          // Ensure uniqueness (case-insensitive)
          const uniqueDistractors = potentialDistractors.reduce((acc: string[], current: string) => {
            if (!acc.map(d => d.toLowerCase()).includes(current.toLowerCase())) {
              acc.push(current);
            }
            return acc;
          }, []);
          console.log(`[MC Options] Unique distractors:`, uniqueDistractors); // Log


          const newOptions: string[] = [correctAnswer];

          // Add unique distractors
          const shuffledDistractors = this.shuffleArray(uniqueDistractors);
          let addedCount = 0;
          for (const distractor of shuffledDistractors) {
            // Check type and ensure it's not the answer itself (case-insensitive)
            if (typeof distractor === 'string' && !newOptions.map(o => o.toLowerCase()).includes(distractor.toLowerCase())) {
              newOptions.push(distractor);
              addedCount++;
              if (addedCount >= 3) break;
            }
          }
          console.log(`[MC Options] Options after adding distractors:`, newOptions); // Log


          // If still not enough options, add generic placeholders
          let genericOptionCounter = 1;
          while (newOptions.length < 4) {
            const genericOption = `Option ${genericOptionCounter}`;
            // Ensure generic option doesn't accidentally match the answer or existing options (case-insensitive)
            if (!newOptions.map(o => o.toLowerCase()).includes(genericOption.toLowerCase())) {
               newOptions.push(genericOption);
               console.log(`[MC Options] Added generic option: ${genericOption}`); // Log
            }
            genericOptionCounter++;
            // Safety break to prevent infinite loops
            if (genericOptionCounter > 10) {
                console.warn("[MC Options] Safety break triggered while adding generic options."); // Log
                break;
            }
          }

          // Shuffle the final options
          question.options = this.shuffleArray(newOptions);
          console.log(`[MC Options] Final shuffled options:`, question.options); // Log
        }
        
        // If we're enforcing question type and it doesn't match what was requested, fix it
        if (quizType !== "mixed" && question.type !== quizType) {
          console.warn(`[Type Fix] AI returned type ${question.type}, but requested ${quizType}. Forcing type.`); // Log
          question.type = quizType;

          // If we're forcing to multiple choice, ensure we have options AND shuffle them
          if (quizType === "multiple" && (!question.options || question.options.length < 4)) {
            console.warn(`[Type Fix] Forcing multiple choice options and shuffling.`); // Log
            const defaultOptions = [question.answer, `Option 1`, `Option 2`, `Option 3`];
            question.options = this.shuffleArray(defaultOptions); // Shuffle the default options
          } else if (quizType === "truefalse") {
            question.options = ["True", "False"];
            // Ensure answer is one of the options
            question.answer = question.answer === "False" ? "False" : "True";
          }
        }
        
        return question;
      });
      
      console.log(`Generated ${validatedQuestions.length} questions successfully`);
      return { success: true, questions: validatedQuestions };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process quiz questions.";
      console.error("Failed to parse quiz generation result:", errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
  
  /**
   * Extract terms and definitions from study material
   * This function is used by the FlashcardCreationForm component to generate flashcards
   */
  async extractTermsAndDefinitions(studyMaterial: string): Promise<{ success: boolean, data?: Array<{ term: string, definition: string }>, error?: string }> {
    try {
      if (!studyMaterial.trim()) {
        return { success: false, error: "No study material provided" };
      }
      
      // Use the existing extractKeyTerms function from geminiService
      const extractionResult = await extractKeyTerms(studyMaterial, "full");
      
      if (!extractionResult || !extractionResult.keyTerms || !Array.isArray(extractionResult.keyTerms)) {
        return { success: false, error: "Failed to extract terms from study material" };
      }
      
      // Convert the key terms to the format expected by flashcards
      const flashcardTerms = extractionResult.keyTerms.map(term => ({
        term: term.term,
        definition: term.meaning
      }));
      
      return { 
        success: true, 
        data: flashcardTerms 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error extracting terms and definitions:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private attemptToFixJson(jsonString: string, originalError: Error): Record<string, unknown>[] | null {
    console.log("Attempting JSON fix for error:", originalError.message);
    let currentJsonString = jsonString;

    try {
      console.log("Fix attempt 1: Removing trailing commas");
      const fixedJson1 = currentJsonString.replace(/,\s*([}\]])/g, '$1');
      const parsed1 = JSON.parse(fixedJson1);
      console.log("Fix attempt 1 successful.");
      return Array.isArray(parsed1) ? parsed1 : [parsed1];
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn("Fix attempt 1 failed:", errorMessage);
      currentJsonString = currentJsonString.replace(/,\s*([}\]])/g, '$1');
    }

    try {
        console.log("Fix attempt 2: Escaping newlines, tabs, and quotes within strings");
        let potentiallyFixed = "";
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < currentJsonString.length; i++) {
            const char = currentJsonString[i];

            if (escapeNext) {
                potentiallyFixed += char;
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                potentiallyFixed += char;
                escapeNext = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                potentiallyFixed += char;
            } else if (inString) {
                if (char === '\n') {
                    potentiallyFixed += '\\n';
                } else if (char === '\r') {
                    potentiallyFixed += '\\r';
                } else if (char === '\t') {
                    potentiallyFixed += '\\t';
                } else if (char === '"') {
                    potentiallyFixed += '\\"';
                }
                 else {
                    potentiallyFixed += char;
                }
            } else {
                potentiallyFixed += char;
            }
        }
        const fixedJson2 = potentiallyFixed.replace(/,\s*([}\]])/g, '$1');
        const parsed2 = JSON.parse(fixedJson2);
        console.log("Fix attempt 2 successful.");
        return Array.isArray(parsed2) ? parsed2 : [parsed2];
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn("Fix attempt 2 failed:", errorMessage);
    }

    try {
      console.log("Fix attempt 3: Regex matching for individual JSON objects");
      const objectMatches = currentJsonString.match(/\{\s*"id":[\s\S]*?\}/g);
      if (objectMatches && objectMatches.length > 0) {
        console.log(`Found ${objectMatches.length} potential JSON objects via regex.`);
        const fixedObjects: Record<string, unknown>[] = [];
        let successfulParses = 0;
        objectMatches.forEach((objStr, index) => {
            try {
                const cleanedObjStr = objStr.replace(/,\s*}/g, '}');
                fixedObjects.push(JSON.parse(cleanedObjStr));
                successfulParses++;
            } catch(objParseError: unknown) {
                const errorMessage = objParseError instanceof Error ? objParseError.message : String(objParseError);
                console.warn(`Fix attempt 3: Failed to parse object ${index + 1}: ${errorMessage}`);
                console.warn(`Problematic object string: ${objStr.substring(0, 200)}...`);
            }
        });

        if (successfulParses > 0) {
             console.log(`Fix attempt 3 successful (parsed ${successfulParses}/${objectMatches.length} individual objects).`);
             return fixedObjects;
        } else {
             console.warn("Fix attempt 3: No objects could be parsed successfully via regex.");
        }

      } else {
         console.warn("Fix attempt 3: No potential objects matched the regex pattern.");
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn("Fix attempt 3 failed unexpectedly:", errorMessage);
    }

    console.error("All JSON fix attempts failed.");
    return null;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  async generateQuizFromManualInput(
    parsedInput: { title: string, terms: Array<{ term: string, definition: string }> },
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false
  ): Promise<QuizGenerationResponse> {
    try {
      // Prepare the study material in a format that's usable for the quiz generation
      let formattedMaterial = `${parsedInput.title}\n\n`;
      
      // Add all terms and definitions
      parsedInput.terms.forEach(item => {
        formattedMaterial += `${item.term} - ${item.definition}\n\n`;
      });
      
      console.log(`Creating quiz from ${parsedInput.terms.length} manually entered terms`);
      
      // Auto-determine number of questions if needed, based on the number of terms
      if (numQuestions === undefined) {
        // For manual input, we want to create at least one question per term
        const termCount = parsedInput.terms.length;
        
        if (termCount <= 5) {
          // For very few terms, create 2 questions per term
          numQuestions = termCount * 2;
        } else if (termCount <= 15) {
          // For small sets, create ~1.5 questions per term
          numQuestions = Math.ceil(termCount * 1.5);
        } else {
          // For larger sets, aim for at least one question per term
          numQuestions = termCount;
        }
        
        // Cap the maximum number of questions at 50
        numQuestions = Math.min(numQuestions, 50);
        
        console.log(`Auto-determined question count for manual input: ${numQuestions} for ${termCount} terms`);
      }
      
      // Generate quiz based on the formatted material, passing the original terms
      return this.generateQuizQuestions(formattedMaterial, numQuestions, quizType, verbatim, parsedInput.terms);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process manual input";
      console.error("Error in generate quiz from manual input:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export async function generateQuiz(
  apiKey: string,
  topic: string,
  difficulty: string,
  numQuestions: number
) {
  try {
    const geminiService = new GeminiCore(apiKey);

    const prompt = `Create a quiz about ${topic}. 
    Difficulty: ${difficulty}. 
    Number of questions: ${numQuestions}.
    Format the output as a JSON array of objects, each with properties:
    - question: the quiz question
    - options: an array of 4 possible answers
    - answer: the index of the correct answer (0-3)
    - explanation: brief explanation of the correct answer
    IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.`;

    const result = await geminiService.generateContent(prompt, "");
    
    if (!result.success) {
      throw new Error(result.error || "Failed to generate quiz.");
    }

    if (!result.data || 
        !result.data.candidates || 
        !result.data.candidates[0] || 
        !result.data.candidates[0].content || 
        !result.data.candidates[0].content.parts || 
        !result.data.candidates[0].content.parts[0]) {
      console.error("Unexpected API response structure:", result.data);
      throw new Error("Unexpected API response structure");
    }
    
    const responseText = result.data.candidates[0].content.parts[0].text.trim();
    
    const cleanedResponse = responseText.replace(/```json\s*/g, '')
                                    .replace(/```\s*$/g, '')
                                    .replace(/```\s*/g, '')
                                    .trim();
    
    const quizData = JSON.parse(cleanedResponse);
    return quizData;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error generating quiz.";
    console.error("Error generating quiz:", errorMessage);
    throw error;
  }
}
