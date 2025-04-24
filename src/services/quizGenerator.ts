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
        // For subcategories, use the main term's meaning as context, but avoid the relational phrase
        term.subcategories.forEach(subcat => {
          if (subcat && subcat.trim()) {
            allTerms.push({
              term: subcat,
              // MODIFIED: Provide main term's meaning as context without the "is a subcategory of" phrase
              meaning: `Context: ${term.term}. ${term.meaning}` 
            });
          }
        });
      }
      
      // Process examples if they exist
      if (term.examples && Array.isArray(term.examples) && term.examples.length > 0) {
        // For examples, use the main term for context, but avoid the relational phrase
        term.examples.forEach(example => {
          if (example && example.trim()) {
            allTerms.push({
              term: example,
              // MODIFIED: Provide main term's meaning as context without the "is an example of" phrase
              meaning: `Context: ${term.term}. ${term.meaning}`
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
    // *** LOGGING ADDED ***
    console.log(`[Quiz Input Material] Start of formattedMaterial (first 300 chars):\n${formattedMaterial.substring(0, 300)}...`);
    
    // Generate quiz using the enhanced formatted material
    return this.generateQuizQuestions(formattedMaterial, numQuestions, quizType, verbatim);
  }

  async generateQuizQuestions(
    studyMaterial: string,
    numQuestions?: number,
    quizType: "multiple" | "truefalse" | "identification" | "statementTrueFalse" | "mixed" = "multiple",
    verbatim: boolean = false, // Log this value
    sourceTerms?: Array<{ term: string, definition: string }>
  ): Promise<QuizGenerationResponse> {
    // *** ADD LOGGING HERE ***
    console.log(`[generateQuizQuestions ENTRY] Args:`, { numQuestions, quizType, verbatim });

    const questionCount = numQuestions ? `${numQuestions}` : "an appropriate number of";
    
    // Keep verbatimInstruction separate for clarity
    const verbatimInstructionContent = verbatim 
      ? `VERY IMPORTANT (VERBATIM MODE): Your task is to identify KEY TERMS and create fill-in-the-blank questions where the BLANK replaces the term, directly followed by the definition/explanation. THIS FORMAT APPLIES *ONLY* TO MULTIPLE CHOICE AND IDENTIFICATION QUESTIONS WHEN VERBATIM MODE IS ACTIVE.

      HOW TO IDENTIFY KEY TERMS (for Verbatim MC/ID):
      - Look for bold or italicized terms
      - Look for numbered or bulleted items with a term followed by a dash (–) or colon (:)
      - Look for lines that start with a clear term followed by explanation
      - Look for section headings or subheadings that define concepts
      - YOU MUST INCLUDE ALL categories, subcategories, and examples as potential terms
      - YOU MUST CREATE QUESTIONS from ALL examples and types mentioned in the study material
      
      FORMAT YOUR QUESTIONS (for Verbatim MC/ID):
      1. For each term you identify, create a question like this ONLY for Multiple Choice and Identification question types:
         "__________ [EXACT explanation/definition that follows the term]"
      2. NEVER include any dash (–) or colon (:) between the blank and the text
      3. The blank must be directly followed by the explanation text
      4. DO NOT include the term in the question text
      
      CRUCIAL RULES (for Verbatim MC/ID):
      - The blank ALWAYS represents the key term
      - The text after the blank MUST be EXACT verbatim passages from the study material
      - DO NOT modify any words from the source material's explanation part
      - Pay special attention to lines that follow this pattern: "Term – explanation" or "Term : explanation"
      - For numbered or bulleted lists that define terms, use the term as the answer
      - YOU MUST CREATE QUESTIONS from ALL examples and categories - these are crucial for comprehensive coverage
      
      Examples (for Verbatim MC/ID):
      
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
      
      EXTREMELY IMPORTANT (for Verbatim MC/ID): Preserve the EXACT capitalization of the key terms as they appear in the source material. Do not lowercase or change any capitalization.
      
      NEVER TRUNCATE OR SPLIT THE TERM (for Verbatim MC/ID). If a term includes a dash (like "Term-Based Analysis"), keep the ENTIRE term as the answer.`
      : `Generate questions that test understanding of the concepts in the study material. Questions can rephrase or reframe the material to test deeper understanding. MOST IMPORTANTLY: INCLUDE ALL key terms, examples, subcategories, and concepts from the material in your question set - make sure every term has at least one question.`;
    
    const statementTrueFalseInstructions = quizType === "statementTrueFalse" || quizType === "mixed" 
      ? `
      For "Statement True/False" questions:
      - Create questions with TWO statements about the material.
      - Label them clearly as "Statement 1:" and "Statement 2:".
      - Make sure each statement can be definitively evaluated as true or false based on the material.
      - Use the standard options:
        A. The first statement is true, the second statement is false.
        B. The first statement is false, the second statement is true.
        C. Both statements are true.
        D. Both statements are false.
      - Make sure the answer is one of these four options (A, B, C, or D).
      `
      : "";
      
    // Specific instructions for standard True/False
    const trueFalseInstructions = (quizType === "truefalse" || quizType === "mixed")
      ? `
      For standard "True/False" questions:
      - Create a SINGLE statement based on the study material.
      - This statement should be either factually correct (True) or incorrect (False) according to the material.
      - You can create false statements by swapping terms/definitions, negating a fact, or slightly altering a concept.
      - The question MUST be a statement, NOT a fill-in-the-blank.
      - The options MUST be ["True", "False"].
      - The answer MUST be either "True" or "False".
      ` : "";

    const systemPrompt = `
      You are an expert quiz generator. Generate ${questionCount} quiz questions based on the study material provided.
      
      Quiz Type: ${quizType === "mixed" ? "Mix of Multiple Choice, True/False, Statement True/False, and Identification" : 
                   quizType === "multiple" ? "Multiple Choice" : 
                   quizType === "truefalse" ? "True/False" :
                   quizType === "statementTrueFalse" ? "Statement True/False" : 
                   "Identification"}
      
      ${verbatimInstructionContent} 
      
      ${trueFalseInstructions} 
      
      ${statementTrueFalseInstructions}
      
      ${numQuestions ? `IMPORTANT: You MUST generate EXACTLY ${numQuestions} questions, no more and no less.` : 
      `IMPORTANT: Generate a comprehensive set of questions that thoroughly covers the material provided.
       - ENSURE you cover ALL key concepts and important information in the material
       - CRITICAL: Do not skip any terms or sections of the content
       - YOU MUST include questions about EVERY example, subcategory, and concept that appears in the material
       - MAXIMIZE COVERAGE - you should aim to have at least one question about every term in the input`}

      GENERAL RULES FOR ALL QUESTION TYPES:
      - CRITICAL INSTRUCTION: The material contains all terms and examples that were extracted. YOU MUST STRIVE TO INCLUDE AS MANY OF THESE TERMS AS POSSIBLE in your questions. Aim for maximum coverage of all terms.
      - AVOID generating questions that use the exact phrases "is a subcategory of" or "is an example of". Test these relationships indirectly if necessary.
      - PRESERVE EXACT CAPITALIZATION of key terms when they are the answer or part of the question statement, unless generating a deliberately incorrect statement for True/False.
      - Ensure the JSON is properly formatted with no syntax errors.
      - Do not wrap your response in markdown code blocks or backticks.
      - Your entire response should be a valid JSON array, nothing else.
      - Cover the FULL BREADTH of the study material - do not neglect any important sections.
      - CRITICAL: Generate questions from EVERY section of the material - don't focus only on the beginning.
      
      SUPER IMPORTANT FOR VERBATIM MULTIPLE CHOICE / IDENTIFICATION:
      - The fill-in-the-blank format "__________ [explanation]" applies ONLY to Multiple Choice and Identification types AND only when verbatim mode is active.
      - DO NOT use this format for True/False or Statement True/False questions.
      - DO NOT create questions asking about the meaning or definition of a term in verbatim mode.
      - INSTEAD, the blank should BE the term itself, and what follows should be the explanation.
      - Looking for patterns like "Term – explanation" or "1. Term - explanation".
      - Never rewrite or paraphrase the explanation - use the EXACT text that follows the term.
      - DO NOT include any dash or colon between the blank and the text that follows.
      - Make sure the answer is the COMPLETE term - not just part of it.
      - For example, if the term is "Eco-Friendly Packaging", the ENTIRE phrase must be the answer, not just "Eco-Friendly".
      - DO NOT use any quotation marks in the verbatim questions.
      - Place EXACTLY ONE blank (________) at the beginning of EACH verbatim MC/ID question without any dash or colon after it.
      - The "answer" field MUST contain the COMPLETE term that would fill in the blank, EXACTLY as it appears in the source.
      
      Format your response as a valid JSON array of quiz question objects with the following format:
      
      For Multiple Choice (Non-Verbatim):
      {
        "id": 1,
        "type": "multiple",
        "question": "[Question testing understanding of a concept]",
        "options": ["Option A", "Option B", "Correct Answer", "Option D"],
        "answer": "Correct Answer",
        "explanation": "Explanation of the correct answer"
      }
      
      For Multiple Choice (Verbatim):
      {
        "id": 1
        "type": "multiple",
        "question": "__________ [Exact explanation from source]",
        "options": ["Distractor Term 1", "Correct Term", "Distractor Term 2", "Distractor Term 3"],
        "answer": "Correct Term",
        "explanation": "Explanation of the correct answer (term)"
      }
      
      For True/False:
      {
        "id": 2,
        "type": "truefalse",
        "question": "[A statement about a concept from the material, which might be true or false]", 
        "options": ["True", "False"],
        "answer": "True", // or "False"
        "explanation": "Explanation of why the statement is true or false based on the material"
      }
      
      For Statement True/False:
      {
        "id": 3,
        "type": "statementTrueFalse",
        "question": "Statement 1: [First statement based on material]\\nStatement 2: [Second statement based on material]",
        "options": [
          "A. The first statement is true, the second statement is false.",
          "B. The first statement is false, the second statement is true.",
          "C. Both statements are true.",
          "D. Both statements are false."
        ],
        "answer": "C. Both statements are true.", // Example answer
        "explanation": "Explanation justifying the truth value of both statements"
      }
      
      For Identification (Non-Verbatim):
      {
        "id": 4,
        "type": "identification",
        "question": "[Question asking to identify a term based on definition/description]",
        "answer": "The Correct Term",
        "options": [],
        "explanation": "Explanation of the answer"
      }
      
      For Identification (Verbatim):
      {
        "id": 4,
        "type": "identification",
        "question": "__________ [Exact definition or description from source]",
        "answer": "The Correct Term",
        "options": [],
        "explanation": "Explanation of the answer (term)"
      }
      
      ONLY return the raw JSON array with no additional text.
    `;

    // Remove the console.log check from within the prompt string itself
    // *** LOGGING REMOVED from prompt string ***

    try {
      // *** ADDING LOGGING BEFORE API CALL ***
      console.log(`[generateQuizQuestions] Generating quiz. Type: ${quizType}, Verbatim: ${verbatim}`);
      if (quizType === 'truefalse') {
          const trueFalseInstructionsInPrompt = systemPrompt.match(/For standard "True\/False" questions:[\s\S]*?answer MUST be either "True" or "False"./);
          console.log('[generateQuizQuestions] Specific T/F Instructions in Prompt:', trueFalseInstructionsInPrompt ? trueFalseInstructionsInPrompt[0] : 'Not Found');
          const trueFalseExampleInPrompt = systemPrompt.match(/For True\/False:\s*\{[\s\S]*?\}/);
          console.log('[generateQuizQuestions] T/F JSON Example in Prompt:', trueFalseExampleInPrompt ? trueFalseExampleInPrompt[0] : 'Not Found');
      }
      if (verbatim) {
          const verbatimAppliesTo = systemPrompt.match(/THIS FORMAT APPLIES \*ONLY\* TO MULTIPLE CHOICE AND IDENTIFICATION/);
          console.log('[generateQuizQuestions] Verbatim scope check in prompt:', verbatimAppliesTo ? 'Found restriction' : 'Restriction MISSING');
      }
      // *** END LOGGING ***

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
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
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
        const initialQuestionFromAI: Partial<QuizQuestion> = {
          id: (q.id as string | number) || undefined,
          type: q.type as "multiple" | "truefalse" | "identification" | "statementTrueFalse", 
          question: (q.question as string) || "",
          options: Array.isArray(q.options) ? q.options as string[] : [],
          answer: (q.answer as string) || "",
          explanation: (q.explanation as string) || ""
        };

        console.log(`[VALIDATION START Q${index + 1}] Verbatim Flag: ${verbatim}, Initial AI Type: '${initialQuestionFromAI.type}', Initial AI Question: "${initialQuestionFromAI.question?.substring(0, 100)}"`);

        const question: QuizQuestion = {
          id: initialQuestionFromAI.id || uuidv4(),
          type: (initialQuestionFromAI.type && ["multiple", "truefalse", "identification", "statementTrueFalse"].includes(initialQuestionFromAI.type as string)) 
            ? initialQuestionFromAI.type as "multiple" | "truefalse" | "identification" | "statementTrueFalse" 
            : quizType === "mixed" ? "multiple" : quizType,
          question: initialQuestionFromAI.question || "Question unavailable",
          options: initialQuestionFromAI.options || [],
          answer: initialQuestionFromAI.answer || "",
          explanation: initialQuestionFromAI.explanation || "No explanation provided"
        };

        // *** ENHANCED TRUE/FALSE DETECTION ***
        // Early detection of True/False questions by multiple criteria
        let isTrueFalseQuestion = false;
        
        // 1. Check type
        if (question.type === "truefalse") {
          isTrueFalseQuestion = true;
        }
        // 2. Check options
        else if (Array.isArray(question.options) && 
            question.options.length === 2 && 
            question.options[0] === "True" && 
            question.options[1] === "False") {
          isTrueFalseQuestion = true;
          question.type = "truefalse";
          console.log(`[T/F Detection Q${index + 1}] Detected True/False by options`);
        }
        // 3. Check answer
        else if (question.answer === "True" || question.answer === "False") {
          isTrueFalseQuestion = true;
          question.type = "truefalse";
          console.log(`[T/F Detection Q${index + 1}] Detected True/False by answer`);
        }
        // 4. Check quiz type setting
        else if (quizType === "truefalse") {
          isTrueFalseQuestion = true;
          question.type = "truefalse";
          console.log(`[T/F Detection Q${index + 1}] Forced True/False by quiz type`);
        }
        
        // *** ENHANCED BLANK REMOVAL FOR TRUE/FALSE ***
        // Always remove blanks for True/False questions EARLY
        if (isTrueFalseQuestion) {
          // First ensure options are correct
          question.options = ["True", "False"];
          
          // Then remove any leading blanks, BUT STORE THE ORIGINAL ANSWER if this was a converted identification question
          const originalQuestion = question.question;
          const originalAnswer = question.answer;
          // First check if question starts with blank
          const hasLeadingBlank = /^[_]+\s*/.test(question.question);
          
          if (hasLeadingBlank) {
            // IMPROVED: Replace the blank with the answer term instead of just removing it
            // This makes the sentence complete rather than leaving it truncated
            // Only do this when the question was clearly an identification question converted to T/F
            if (initialQuestionFromAI.type === "identification" && originalAnswer && typeof originalAnswer === 'string') {
              // Insert the original answer where the blank was
              question.question = originalAnswer + " " + question.question.replace(/^[_]+\s*/, '').trim();
              console.log(`[T/F Blank REPLACED Q${index + 1}] Replaced blank with answer term '${originalAnswer}'`);
            } else {
              // Fallback to just removing the blank if we can't determine the original answer
              question.question = question.question.replace(/^[_]+\s*/, '').trim();
              console.log(`[T/F Blank Removal Q${index + 1}] Removed blanks from True/False question without replacement`);
            }
          }
          
          // Now that we have a complete sentence (Question = "[Term] [definition]"), we need to decide if it's True or False
          // If this was a converted identification question, we should determine if the statement is actually true
          if (initialQuestionFromAI.type === "identification" && hasLeadingBlank && originalAnswer && typeof originalAnswer === 'string') {
            // Default to 50/50 True/False rather than always True
            // For better variation in answers
            const randomizeTrueFalse = Math.random() < 0.5;
            
            if (randomizeTrueFalse) {
              // Make the statement false by replacing the term with a different term
              // First try to find another term from other questions
              const otherAnswers = questions
                .filter((oq: Record<string, unknown>, idx: number) => 
                  idx !== index && 
                  oq.answer && 
                  typeof oq.answer === 'string' && 
                  oq.answer.toLowerCase() !== originalAnswer.toLowerCase()
                )
                .map((oq: Record<string, unknown>) => oq.answer as string);
              
              if (otherAnswers.length > 0) {
                // Pick a random wrong term to use
                const wrongTerm = otherAnswers[Math.floor(Math.random() * otherAnswers.length)];
                // Replace the original term with the wrong term
                question.question = question.question.replace(new RegExp(`^${originalAnswer}\\b`, 'i'), wrongTerm);
                // Set answer to False since we made the statement incorrect
                question.answer = "False";
                // Update the explanation to explain why it's false
                question.explanation = `This statement is false. ${wrongTerm} is not correctly paired with this description. The correct term is ${originalAnswer}.`;
                console.log(`[T/F Answer Q${index + 1}] Set to FALSE by replacing term with '${wrongTerm}'`);
              } else {
                // If we can't find another term, set to False and modify the statement
                question.answer = "False";
                // Add a negation in the explanation
                question.explanation = `This statement is false. The correct term for this description is ${originalAnswer}.`;
                console.log(`[T/F Answer Q${index + 1}] Set to FALSE with updated explanation`);
              }
            } else {
              // Keep the statement true
              question.answer = "True";
              question.explanation = `This statement is true. ${originalAnswer} is correctly described.`;
              console.log(`[T/F Answer Q${index + 1}] Set to TRUE with updated explanation`);
            }
          }
        }

        // *** NEW CHECK ***
        // If options are exactly ["True", "False"], force type to "truefalse"
        // This catches cases where the AI returns a T/F structure without the correct type field.
        if (Array.isArray(question.options) &&
            question.options.length === 2 &&
            question.options[0] === "True" &&
            question.options[1] === "False") {
            if (question.type !== "truefalse") {
                console.warn(`[Validation Fix Q${index + 1}] Forcing type to 'truefalse' based on options ['True', 'False']. Original type was '${question.type}'.`);
                question.type = "truefalse";
            }
        }

        // *** Type forcing based on answer ***
        // If the type isn't already T/F but the answer is literally "True" or "False", force it.
        // This catches cases where AI provides T/F answer but wrong type/options.
        if (question.type !== "truefalse" && (question.answer === "True" || question.answer === "False")) {
            console.warn(`[Validation Fix Q${index + 1}] Forcing type to 'truefalse' based on answer ('${question.answer}'). Original type was '${question.type}'.`);
            question.type = "truefalse";
        }

        // Handle verbatim formatting ONLY for MC and ID types
        if (verbatim && (question.type === "multiple" || question.type === "identification")) { // <-- ADDED TYPE CHECK HERE
          question.question = question.question.replace(/["""''`]/g, '');
          question.question = question.question.replace(/^_+\s*[-–—:]\s*/, '__________ ');
          if (!question.question.trim().startsWith('__________')) {
             console.warn(`[Verbatim Fix Q${index + 1}] Adding missing blank for verbatim MC/ID.`);
             question.question = '__________ ' + question.question.trim();
          }
          // Ensure answer capitalization matches source if possible (best effort)
          if (question.answer) {
             // Find the original term casing if sourceTerms are available
             const sourceTerm = sourceTerms?.find(st => st.term.toLowerCase() === question.answer.toLowerCase());
             if (sourceTerm) {
                 question.answer = sourceTerm.term; // Use original casing
             }
          }
        }
        
        // Ensure proper options for different question types
        if (question.type === "truefalse") {
          // DEBUG: Log the question before T/F processing
          console.log(`[T/F PRE Q${index + 1}] Before blank removal: "${question.question.substring(0, 40)}"`);
          console.log(`[T/F REGEX Q${index + 1}] Checking if starts with blanks: ${/^_+\s*/.test(question.question)}`);
          
          question.options = ["True", "False"];
          // CRITICAL FIX: Ensure T/F questions DON'T start with the blank placeholder, 
          // even if verbatim was requested overall for the quiz.
          const before = question.question;
          question.question = question.question.replace(/^_+\s*/, '').trim();
          
          // DEBUG: Log the question after T/F processing
          console.log(`[T/F POST Q${index + 1}] After blank removal:`, {
            before: before.substring(0, 40),
            after: question.question.substring(0, 40),
            changed: before !== question.question
          });
          
          // Validate T/F answer
          if (!question.answer || !["True", "False"].includes(question.answer)) {
              console.warn(`[Validation Fix Q${index + 1}] Invalid answer ('${question.answer}') for True/False. Attempting to determine based on explanation or defaulting.`);
              // Basic check: if explanation mentions 'incorrect', 'opposite', 'false', assume False.
              const explanationLower = question.explanation.toLowerCase();
              if (explanationLower.includes('incorrect') || explanationLower.includes('opposite') || explanationLower.includes('false') || explanationLower.includes('not true')) {
                  question.answer = "False";
              } else {
                  // If explanation suggests correctness or is neutral, assume True (less safe default)
                  question.answer = "True"; 
              }
              console.warn(`[Validation Fix Q${index + 1}] Corrected T/F answer to '${question.answer}'`);
          }
        }
        
        // FINAL SAFETY CHECK - ensure no True/False questions have blanks
        if (question.type === "truefalse" && question.question.match(/^_+\s*/)) {
            console.warn(`[FINAL CHECK Q${index + 1}] True/False still has blanks! Removing them now.`);
            question.question = question.question.replace(/^_+\s*/, '').trim();
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
          let currentOptions = question.options || []; // Options from LLM (if any)
          console.log(`[MC Options DEBUG Q${index + 1}] Initial options from LLM:`, currentOptions); // Log options from LLM

          // Ensure the correct answer is included if options were provided
          if (currentOptions.length > 0 && !currentOptions.map(o => o.toLowerCase()).includes(correctAnswer.toLowerCase())) {
              console.warn(`[MC Options DEBUG Q${index + 1}] Correct answer "${correctAnswer}" missing from LLM options. Adding it.`);
              currentOptions.push(correctAnswer); // Add if missing
          } else if (currentOptions.length === 0) {
              console.log(`[MC Options DEBUG Q${index + 1}] No options from LLM. Starting with only correct answer.`);
              currentOptions = [correctAnswer]; // Start with the correct answer if none provided
          }

          // Remove duplicates (case-insensitive) keeping the first occurrence
          const uniqueCurrentOptions = currentOptions.reduce((acc: string[], current: string) => {
            if (!acc.map(o => o.toLowerCase()).includes(current.toLowerCase())) {
              acc.push(current);
            }
            return acc;
          }, []);
          console.log(`[MC Options DEBUG Q${index + 1}] Unique options after initial processing:`, uniqueCurrentOptions);

          const newOptions: string[] = [...uniqueCurrentOptions]; // Start building final options

          // Try adding distractors from sourceTerms or other answers (if needed)
          if (newOptions.length < 4) {
              let potentialDistractors: string[] = [];
              // PRIORITIZE sourceTerms if available (manual input)
              if (sourceTerms && sourceTerms.length > 0) {
                console.log(`[MC Options DEBUG Q${index + 1}] Using sourceTerms (count: ${sourceTerms.length})`); // Log
                potentialDistractors = sourceTerms
                  .map(t => (t.term || "").trim()) // Ensure trimmed
                  .filter(term => term !== ''); // Ensure distractors are strings, not empty
              } else {
                // Fallback: Try to get distractors from other generated questions' answers (auto mode)
                console.log(`[MC Options DEBUG Q${index + 1}] Using other questions' answers as distractors`); // Log
                potentialDistractors = questions
                  .filter((oq: Record<string, unknown>) => oq.id !== q.id && typeof oq.answer === 'string' && (oq.answer as string).trim() !== '')
                  .map((oq: Record<string, unknown>) => (oq.answer as string).trim()); // Ensure trimmed
              }
              console.log(`[MC Options DEBUG Q${index + 1}] Potential distractors from other sources:`, potentialDistractors);

              // Ensure uniqueness (case-insensitive) and filter out the correct answer
              const uniqueDistractors = potentialDistractors.reduce((acc: string[], current: string) => {
                if (!acc.map(d => d.toLowerCase()).includes(current.toLowerCase()) && current.toLowerCase() !== correctAnswer.toLowerCase()) {
                  acc.push(current);
                }
                return acc;
              }, []);
              console.log(`[MC Options DEBUG Q${index + 1}] Unique distractors from other sources:`, uniqueDistractors);

              const shuffledDistractors = this.shuffleArray(uniqueDistractors);
              for (const distractor of shuffledDistractors) {
                  if (newOptions.length >= 4) break;
                  // Check type and ensure it's not already in newOptions (case-insensitive)
                  if (typeof distractor === 'string' && !newOptions.map(o => o.toLowerCase()).includes(distractor.toLowerCase())) {
                      newOptions.push(distractor);
                  }
              }
              console.log(`[MC Options DEBUG Q${index + 1}] Options after adding distractors from other sources:`, newOptions);
          }


          // If still not enough options, extract words from the study material
          if (newOptions.length < 4) {
            console.log(`[MC Options DEBUG Q${index + 1}] Fallback: Extracting keywords from studyMaterial.`);
            // *** LOG THE STUDY MATERIAL BEING USED HERE ***
            console.log(`[MC Options DEBUG Q${index + 1}] studyMaterial length for keyword extraction: ${studyMaterial.length}`);
            console.log(`[MC Options DEBUG Q${index + 1}] studyMaterial start: "${studyMaterial.substring(0, 200)}..."`);

            const skipWords = new Set(["a", "an", "the", "in", "on", "at", "to", "for", "with", "by", "about", "and", "or", "but", "if", "then", "than", "that", "this", "these", "those", "it", "its"]);
            const answerWords = new Set(correctAnswer.toLowerCase().split(/\s+/).map(w => w.replace(/[.,;:!?()[\]{}"\d]/g, '').trim()).filter(w => w.length > 0));
            console.log(`[MC Options DEBUG Q${index + 1}] answerWords to filter:`, answerWords);

            const words = studyMaterial.split(/\s+/)
              .map(w => w.replace(/[.,;:!?()[\]{}"\d]/g, '').trim())
              .filter(w => w.length > 3 && !skipWords.has(w.toLowerCase()))
              .filter(w => !answerWords.has(w.toLowerCase())); // Filter out words exactly matching answer words

            const significantWords = [...new Set(words)]; // Get unique words
            console.log(`[MC Options DEBUG Q${index + 1}] Found ${significantWords.length} significant keywords:`, significantWords.slice(0, 10)); // Log found keywords

            const shuffledWords = this.shuffleArray(significantWords);
            for (let i = 0; i < shuffledWords.length && newOptions.length < 4; i++) {
              const word = shuffledWords[i];
              if (word && !newOptions.map(o => o.toLowerCase()).includes(word.toLowerCase())) {
                // Capitalize the first letter to make it look like a term
                const formattedOption = word.charAt(0).toUpperCase() + word.slice(1);
                newOptions.push(formattedOption);
              }
            }
            console.log(`[MC Options DEBUG Q${index + 1}] Options after adding keywords:`, newOptions);
          }
          
          // Final fallback to generic options if STILL needed
          let genericOptionCounter = 1;
          while (newOptions.length < 4) {
            const genericOption = `Alternative ${genericOptionCounter}`;
            console.log(`[MC Options DEBUG Q${index + 1}] Adding generic option: ${genericOption}`); // Log generic add
            // Ensure generic option doesn't accidentally match the answer or existing options (case-insensitive)
            if (!newOptions.map(o => o.toLowerCase()).includes(genericOption.toLowerCase())) {
               newOptions.push(genericOption);
            }
            genericOptionCounter++;
            // Safety break to prevent infinite loops
            if (genericOptionCounter > 10) {
                console.warn(`[MC Options DEBUG Q${index + 1}] Safety break triggered adding generic options.`);
                break;
            }
          }

          // Shuffle the final options
          question.options = this.shuffleArray(newOptions);
          console.log(`[MC Options DEBUG Q${index + 1}] Final options:`, question.options); // Log final options
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
