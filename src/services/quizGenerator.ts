import GeminiCore from "./geminiCore";
import { QuizGenerationResponse, QuizQuestion } from "../types/quiz";
import { v4 as uuidv4 } from "uuid";
import { initializeGemini } from "./geminiService";

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

      // OPTIMIZATION: Direct single-call quiz generation instead of double processing
      // Skip extraction step and generate quiz directly from study material
      console.log("🚀 Using optimized direct quiz generation...");

      // Auto-determine number of questions if needed based on text length
      if (numQuestions === undefined) {
        numQuestions = this.determineOptimalQuestionCountFromText(studyMaterial);
      }

      // Generate quiz directly from study material in one API call
      return this.generateQuizQuestions(studyMaterial, numQuestions, quizType, verbatim);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process text";
      console.error("Error in extract and generate quiz:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Optimized method to determine question count based on text length
  private determineOptimalQuestionCountFromText(studyMaterial: string): number {
    const textLength = studyMaterial.length;
    const wordCount = studyMaterial.split(/\s+/).length;

    console.log(`Auto-determining question count for text: ${textLength} chars, ${wordCount} words`);

    let questionCount: number;

    if (wordCount <= 100) {
      questionCount = 5; // Very short text
    } else if (wordCount <= 300) {
      questionCount = 10; // Short text
    } else if (wordCount <= 800) {
      questionCount = 15; // Medium text
    } else if (wordCount <= 1500) {
      questionCount = 20; // Long text
    } else {
      questionCount = 25; // Very long text
    }

    // Cap at reasonable limits
    questionCount = Math.max(5, Math.min(questionCount, 30));

    console.log(`Auto-determined question count: ${questionCount}`);
    return questionCount;
  }

  private determineOptimalQuestionCount(extractionResult: any): number {
    // Legacy method - kept for compatibility but not used in optimized flow
    return 10;
  }

  // Helper method to extract all meaningful terms (legacy - not used in optimized flow)
  private getAllMeaningfulTerms(extractionResult: any): Array<{ term: string, meaning: string }> {
    // Legacy method - kept for compatibility but not used in optimized flow  
    return [];
  }

  async generateQuizFromExtractedTerms(
    extractionResult: any,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false
  ): Promise<QuizGenerationResponse> {
    // Legacy method - not used in optimized flow
    console.warn("Using legacy extraction method - consider using direct generation for better performance");
    return this.generateQuizQuestions("", numQuestions, quizType, verbatim);
  }

  async generateQuizQuestions(
    studyMaterial: string,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false,
    // Renamed for clarity: terms provided directly (e.g., manual input)
    manualSourceTerms?: Array<{ term: string, definition: string }>,
    // Added: all terms extracted from the material (used when not manual)
    allExtractedTerms?: Array<{ term: string, meaning: string }>
  ): Promise<QuizGenerationResponse> {
    const questionCount = numQuestions ? `${numQuestions}` : "an appropriate number of";

    const verbatimInstruction = verbatim
      ? (quizType === "truefalse"
        ? `IMPORTANT: For TRUE/FALSE questions, create complete statements that can be evaluated as true or false.
        
        HOW TO CREATE TRUE/FALSE QUESTIONS FROM VERBATIM MATERIAL:
        - Look for key terms and their definitions/explanations in the study material
        - Create complete statements using the EXACT text from the source material
        - Make statements that are either clearly true or clearly false based on the material
        - Use the exact wording and capitalization from the source material
        
        FORMAT YOUR TRUE/FALSE QUESTIONS:
        1. Create complete statements like: "[Term] [exact explanation from source material]"
        2. Use EXACT verbatim text from the source material
        3. Ensure each statement can be definitively evaluated as true or false
        4. DO NOT create fill-in-the-blank questions for true/false type
        
        Examples:
        
        Source text: "Cheat/hack clients – not allowed, players found breaking this rule will face a warning first then permanent ban."
        
        CORRECT TRUE statement: "Cheat/hack clients are not allowed, players found breaking this rule will face a warning first then permanent ban."
        CORRECT FALSE statement: "Cheat/hack clients are allowed without any consequences."
        
        Source text: "X-Ray – not allowed, players found breaking this rule will face a warning first then permanent ban."
        
        CORRECT TRUE statement: "X-Ray is not allowed, players found breaking this rule will face a warning first then permanent ban."
        CORRECT FALSE statement: "X-Ray is permitted for all players to use."
        
        CRUCIAL RULES:
        - Create COMPLETE statements, not fill-in-the-blank questions
        - Use EXACT verbatim text from the source material when creating true statements
        - For false statements, modify the meaning while keeping similar structure
        - Preserve EXACT capitalization of terms as they appear in source material
        - Answer must be either "True" or "False"`
        : `VERY IMPORTANT: Your task is to identify KEY TERMS and create fill-in-the-blank questions where the BLANK replaces the term, directly followed by the definition/explanation.

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
        
        NEVER TRUNCATE OR SPLIT THE TERM. If a term includes a dash (like "Term-Based Analysis"), keep the ENTIRE term as the answer.`)
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
      
      IMPORTANT:
      1. Ensure proper escaping of special characters in JSON strings
      2. For verbatim questions, make sure the "answer" field contains the COMPLETE term (including any dashes or hyphens) that appears in the source material
      3. Only include information directly from the provided study material
      4. For multiple choice, ensure ALL options (correct answer and distractors) are relevant terms from the study material. DO NOT use generic placeholders like \\"Option 1\\", \\"Option 2\\", \\"Incorrect Option A\\", etc., under ANY circumstances. If you cannot find enough distinct terms from the material to create multiple options, provide fewer options, but they MUST come from the material.
      5. Ensure the JSON is properly formatted with no syntax errors
      6. Do not wrap your response in markdown code blocks or backticks
      7. Your entire response should be a valid JSON array, nothing else
      8. Cover the FULL BREADTH of the study material - do not neglect any important sections
      9. Place EXACTLY ONE blank (________) at the beginning of EACH question without any dash or colon after it
      10. DO NOT use any quotation marks in the verbatim questions
      11. The \\"answer\\" field MUST contain the COMPLETE term that would fill in the blank, EXACTLY as it appears in the source
      12. PRESERVE EXACT CAPITALIZATION of key terms
      13. CRITICAL: Generate questions from EVERY section of the material - don't focus only on the beginning
      14. DO NOT generate duplicate questions. Each question in the array must be unique.
      15. EXPLANATION REQUIREMENT: Every question MUST include a brief 1-sentence explanation in the "explanation" field that explains why the answer is correct. NO "No explanation provided" responses allowed.
      
      JSON Format for each question:
      {
        "question": "question text",
        "options": ["A", "B", "C", "D"] (for multiple choice only),
        "answer": "correct answer",
        "explanation": "Brief 1-sentence explanation of why this answer is correct"
      }
      
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

      // Fix type casting for API response
      const apiData = result.data as any;
      const responseText = apiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!responseText) {
        return { success: false, error: "No response received from API" };
      }

      console.log("Raw API response (first 500 chars):", responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));

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
        }
      }

      let questions;
      try {
        questions = JSON.parse(jsonString);
        console.log("Successfully parsed JSON on first attempt.");
      } catch (parseError: unknown) {
        console.error("JSON parse error:", parseError);
        // Simplified error - just return the error instead of complex repair logic
        return {
          success: false,
          error: `Failed to parse quiz response. Please try again with simpler content.`
        };
      }

      if (!Array.isArray(questions)) {
        if (typeof questions === 'object' && questions !== null) {
          console.warn("Parsed result was a single object, wrapping in an array.");
          questions = [questions];
        } else {
          return { success: false, error: "Invalid response format from AI." };
        }
      }



      // Simplified validation and mapping
      const validatedQuestions: QuizQuestion[] = questions.map((q: Record<string, unknown>, index: number) => {
        const question: QuizQuestion = {
          id: (q.id as string) || uuidv4(),
          type: (q.type && ["multiple", "truefalse", "identification", "statementTrueFalse"].includes(q.type as string))
            ? q.type as "multiple" | "truefalse" | "identification" | "statementTrueFalse"
            : quizType === "mixed" ? "multiple" : quizType,
          question: (q.question as string) || "Question unavailable",
          options: Array.isArray(q.options) ? q.options as string[] : [],
          answer: (q.answer as string) || "",
          explanation: (q.explanation as string) || "Brief explanation of the correct answer"
        };



        // Handle verbatim formatting
        if (verbatim) {
          question.question = question.question.replace(/["""''`]/g, '');

          // For True/False questions, don't apply fill-in-the-blank formatting
          if (question.type === "truefalse") {
            // Keep the question as a complete statement for True/False
            // The AI should have already generated complete statements
            // Just clean up any unwanted characters
            question.question = question.question.trim();

            // Ensure the answer is either "True" or "False"
            if (question.answer && !["True", "False"].includes(question.answer.trim())) {
              // If the answer is not True/False, default to True
              question.answer = "True";
            }
          } else {
            // For other question types, apply the fill-in-the-blank formatting
            if (!question.question.trim().startsWith('__________')) {
              const dashMatch = question.question.match(/(.+?)[-–—:](.+)/);
              if (dashMatch && dashMatch[2]) {
                question.question = `__________ ${dashMatch[2].trim()}`;
              } else {
                question.question = `__________ ${question.question.trim()}`;
              }
            }
            if (question.answer) {
              question.answer = question.answer.replace(/[.,;:!?]$/, '');
            }
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
            question.answer = question.options[0] || "A. The first statement is true, the second statement is false.";
          }
        }

        // Fix for multiple choice - simplified approach
        if (question.type === "multiple") {
          const correctAnswer = (question.answer || "").trim();

          if (!question.options.includes(correctAnswer) && correctAnswer) {
            // Add correct answer if it's not already in options
            question.options = [correctAnswer, ...question.options.slice(0, 3)];
          }

          // Shuffle options
          question.options = this.shuffleArray(question.options);

          // Ensure we have at least 2 options
          if (question.options.length < 2) {
            question.options = [correctAnswer, "Other option"];
          }
        }

        return question;
      });

      console.log(`Generated ${validatedQuestions.length} questions successfully.`);
      return { success: true, questions: validatedQuestions };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process quiz questions.";
      console.error("Failed to generate quiz:", errorMessage);
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
          } catch (objParseError: unknown) {
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
      let formattedMaterial = `${parsedInput.title}\\n\\n`;

      // Add all terms and definitions
      parsedInput.terms.forEach(item => {
        formattedMaterial += `${item.term} - ${item.definition}\\n\\n`;
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

      // Generate quiz based on the formatted material, passing the original terms as manualSourceTerms
      return this.generateQuizQuestions(formattedMaterial, numQuestions, quizType, verbatim, parsedInput.terms, undefined);
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
