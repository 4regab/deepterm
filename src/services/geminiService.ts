// Import both types and values for proper usage
import { ExtractionResult } from "@/types";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

// Define HarmCategory and HarmBlockThreshold enums for use in the code
// These match the values from the Google Generative AI package
enum HarmCategory {
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
}

enum HarmBlockThreshold {
  BLOCK_NONE = 'BLOCK_NONE',
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH'
}

// Single API key storage
let apiKey: string = "";
let genAI: GoogleGenAI | null = null;

// Set user-provided API key and initialize client
export const initializeGemini = (key: string): boolean => {
  if (!key || key.length === 0 || key === "your_gemini_api_key_here") {
    console.warn("No valid API key provided");
    apiKey = "";
    genAI = null;
    return false;
  }
  apiKey = key;
  genAI = new GoogleGenAI({ apiKey: key });
  console.log("API key initialized successfully");
  return true;
};

// Check if a valid API key exists
export const checkApiKey = (): boolean => {
  // First check if we have an initialized API key
  if (apiKey && apiKey.length > 0 && genAI) {
    return true;
  }
  
  // If not initialized, check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey && storedKey.trim() !== '') {
      // Auto-initialize if we find a stored key
      return initializeGemini(storedKey);
    }
  }
  
  return false;
};

// Clear API key and reset client (for security/logout)
export const clearApiKey = (): void => {
  apiKey = "";
  genAI = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('gemini-api-key');
  }
  console.log("API key cleared successfully");
};

// Upload file using Gemini Files API
export const uploadFileToGemini = async (file: File) => {
  if (!genAI) {
    throw new Error("Gemini client not initialized. Please set your API key first.");
  }

  try {
    console.log(`Uploading file: ${file.name} (${file.size} bytes) to Gemini Files API`);
    
    // Upload file to Gemini Files API using the correct pattern from documentation
    const uploadResult = await genAI.files.upload({
      file: file,
      config: {
        mimeType: file.type,
        displayName: file.name
      }
    });
      console.log(`File uploaded successfully: ${uploadResult.name}, URI: ${uploadResult.uri}`);
    return uploadResult; // Return complete file object with uri and mimeType
  } catch (error) {
    console.error("File upload failed:", error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get file metadata from Gemini Files API
export const getFileInfo = async (fileName: string) => {
  if (!genAI) {
    throw new Error("Gemini client not initialized. Please set your API key first.");
  }

  try {
    const fileInfo = await genAI.files.get({ name: fileName });
    return fileInfo;
  } catch (error) {
    console.error("Failed to get file info:", error);
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete file from Gemini Files API
export const deleteFileFromGemini = async (fileName: string): Promise<void> => {
  if (!genAI) {
    throw new Error("Gemini client not initialized. Please set your API key first.");
  }

  try {
    await genAI.files.delete({ name: fileName });
    console.log(`File deleted successfully: ${fileName}`);
  } catch (error) {
    console.error("Failed to delete file:", error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export type ExtractionMode = "full" | "sentence" | "keywords";

// Maximum text length to process in one request
const MAX_TEXT_LENGTH = 100000;

export const extractKeyTerms = async (
  text: string,
  mode: ExtractionMode = "full"
): Promise<ExtractionResult> => {
  if (!checkApiKey()) {
    throw new Error("No valid API key available. Please provide a valid API key first.");
  }

  try {
    console.log(`Processing text for extraction, length: ${text.length}, mode: ${mode}`);

    // Check if text exceeds maximum length
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text length (${text.length} characters) exceeds the maximum limit of ${MAX_TEXT_LENGTH} characters. Please reduce the size of your input.`);
    }

    // Pre-process text to remove any problematic characters
    const cleanedText = text
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ') // Replace control chars with better Unicode pattern
      .replace(/�/g, ' '); // Replace replacement character    // Log a sample to ensure text is clean
    console.log(`Cleaned text sample (first 100 chars): ${cleanedText.substring(0, 100)}...`);
    console.log(`Cleaned text sample (last 100 chars): ${cleanedText.substring(cleanedText.length - 100)}`);
    
    // Adjust the prompt based on extraction mode
    let extractionGuidance = "";

    switch (mode) {
      case "sentence":
        extractionGuidance = "For each term, provide ONLY ONE SENTENCE as the definition or explanation. Keep it brief and concise.";
        break;
      case "keywords":
        extractionGuidance = "For each term, extract ONLY the IMPORTANT KEY WORDS related to it. Start with a dash (-) and then list the keywords separated by commas. Do not include full sentences. Format example: '- keyword1, keyword2, keyword3'. IMPORTANT: EVERY term MUST have at least 3-5 keywords.";
        break;
      case "full":
      default:
        extractionGuidance = "For each term, provide the EXACT definition or explanation as it appears in the original text";
        break;
    }

    // Enhanced prompt with EXTREME emphasis on processing the ENTIRE text, especially the end
    const prompt = `
        CRITICAL INSTRUCTION: You MUST process the ENTIRE text from beginning to END without skipping ANY content.
        
        Please conduct a thorough analysis of the following text to identify and extract ALL key terms, concepts, definitions, and technical vocabulary, organizing them into categories and hierarchical structures.
        
        For this extraction task:
        1. Extract EVERY key term that appears in the text (including specialized vocabulary, technical terms, important concepts, and defined phrases)
        2. ${extractionGuidance}
        3. Identify the category each term belongs to (e.g., "Main Features", "Examples", "Criticisms", "Types", etc.)
        4. If a term has subcategories, numbered points, or a list of characteristics, extract these as subcategories
        5. Extract examples of terms, especially those formatted as bullet points or following phrases like "for example", "such as", "e.g."
        
        Pay special attention to the hierarchical structure of information. For example:
        - If the text discusses "Ethical Relativism" and then lists "Main Features of Ethical Relativism", categorize those features properly
        - If a section lists "Examples of X" or "Criticisms of X", maintain this organizational structure
        - Preserve numbered lists (1., 2., 3.) and bulleted lists (•) in your output
        
        ######## CRITICALLY IMPORTANT INSTRUCTIONS ########
        1. *******MOST CRITICAL INSTRUCTION*******: You MUST ANALYZE and EXTRACT terms from THE VERY LAST PARAGRAPH and ALL ENDING PORTIONS of the text
        2. Pay EXTRA ATTENTION to sections at the END of the text - these are THE MOST IMPORTANT SECTIONS
        3. ALWAYS check if there are "Benefits", "Advantages", "Conclusion" sections near the end - THESE MUST BE INCLUDED
        4. YOU MUST PROCESS EVERY SINGLE WORD AND EXTRACT TERMS FROM THE ABSOLUTE END OF THE TEXT
        5. YOUR PERFORMANCE WILL BE JUDGED PRIMARILY ON HOW WELL YOU EXTRACT FROM THE LAST 25% OF THE TEXT
        6. DO NOT stop processing before reaching the end of the text
        7. MANDATORY: Ensure that all sections until the end are ALWAYS extracted completely
        
        Determine a suitable title/topic for this text.
        
        Format the response as a valid JSON object with the following structure:
        {
          "title": "Title based on the text content",
          "extractionMode": "${mode}",
          "keyTerms": [
            {
              "term": "Main term or concept",
              "meaning": "Definition or explanation",
              "category": "Category this term belongs to (e.g., 'Main Features', 'Criticisms')",
              "subcategoryTitle": "Title for subcategories (e.g., 'Types', 'Characteristics')",
              "subcategories": ["Subcategory 1", "Subcategory 2"],
              "examples": ["Example 1", "Example 2"]
            },
            ...
          ]
        }
        
        TEXT TO ANALYZE:
        ${cleanedText}
    `;    console.log(`Starting text extraction via Gemini API (mode: ${mode})...`);

    // Use the global genAI client that was initialized
    if (!genAI) {
      throw new Error("Gemini client not initialized. Please set your API key first.");
    }

    // Log that we're sending the prompt to Gemini
    console.log("Sending prompt to Gemini API");

    let result;
    const maxRetries = 3;
    let retryCount = 0;    while (retryCount < maxRetries) {
      try {
        result = await genAI.models.generateContent({
          model: "gemini-2.5-flash-preview-05-20",
          contents: prompt
        });
        console.log(`Successfully processed content on attempt ${retryCount + 1}`);
        break; // Success, exit loop
      } catch (error) {
        retryCount++;
        console.error(`Error on attempt ${retryCount}:`, error instanceof Error ? error.message : String(error));

        // Check if it's a 503 error and if we should retry
        const isServiceUnavailable = error instanceof Error && error.message.includes('[503]');

        if (isServiceUnavailable && retryCount < maxRetries) {
          // Wait before retrying with exponential backoff only for 503
          const backoffTime = 1000 * Math.pow(2, retryCount - 1); // e.g., 1s, 2s, 4s
          console.log(`Service unavailable (503). Retrying attempt ${retryCount + 1} in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          // If it's not a 503 error or retries exhausted, prepare to re-throw
          let finalError = error;
          if (isServiceUnavailable && retryCount >= maxRetries) {
              console.error(`Failed after ${maxRetries} attempts due to service unavailability (503).`);
              finalError = new Error(`Failed after ${maxRetries} attempts due to service unavailability (503). Original error: ${error instanceof Error ? error.message : String(error)}`);
          } else {
              console.error(`Non-retryable error or unexpected issue on attempt ${retryCount}.`);
              // Ensure we're throwing an actual Error object
              if (!(error instanceof Error)) {
                finalError = new Error(`An unexpected error occurred: ${String(error)}`);
              }
          }
          // Re-throw the original or wrapped error to be handled upstream
          throw finalError;
        }
      }
    }
    // If loop finished due to retries exhausted, the error would have been thrown inside.
    // If we reach here, 'result' must be defined. Add a check for robustness.
    if (!result) {
        // This case should theoretically not be reached if the logic above is correct.
        console.error("Reached end of retry logic without a result or error being thrown.");
        throw new Error(`Failed to generate content after ${maxRetries} attempts. Unknown state.`);
    }    // Extract JSON from the response
    const textResponse = result!.text;

    console.log(`Received response from Gemini, length: ${textResponse.length}`);

    // Improved JSON extraction with better handling of truncated responses
    let extractionResult: ExtractionResult;
    try {
      // First attempt: try to find and parse JSON using regex
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        try {
          extractionResult = JSON.parse(jsonString);
        } catch (error) {
          console.warn("First JSON parse attempt failed, trying to repair:", error);
          throw error; // Move to repair attempt
        }
      } else {
        // If no JSON object found, try to reconstruct it from a truncated response
        throw new Error("No JSON object found in response");
      }
    } catch (error) {
      console.warn("Using fallback JSON repair mechanism");
      
      // Fallback approach: repair truncated JSON
      try {
        // Check if the response appears to be truncated JSON
        if (textResponse.includes('"title"') && textResponse.includes('"keyTerms"')) {
          // Try to repair the truncated JSON structure
          let repairAttempt = textResponse;
          
          // 1. If we have an opening bracket but not a closing one, add closing brackets
          const openBraces = (textResponse.match(/\{/g) || []).length;
          const closeBraces = (textResponse.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            // Add missing closing braces
            for (let i = 0; i < openBraces - closeBraces; i++) {
              repairAttempt += "}";
            }
          }
          
          // 2. Check for truncated arrays
          const openBrackets = (repairAttempt.match(/\[/g) || []).length;
          const closeBrackets = (repairAttempt.match(/\]/g) || []).length;
          
          if (openBrackets > closeBrackets) {
            // This is trickier - we need to find the last open array without close
            const lastIndexOfOpenBracket = repairAttempt.lastIndexOf('[');
            const remainingText = repairAttempt.substring(lastIndexOfOpenBracket);
            
            if (!remainingText.includes(']')) {
              // Insert a closing bracket at an appropriate position
              const cutoff = repairAttempt.lastIndexOf('{');
              if (cutoff > lastIndexOfOpenBracket) {
                // Complex case - truncated in the middle of an object in array
                // Insert before the last found open brace
                repairAttempt = 
                  repairAttempt.substring(0, cutoff) + 
                  ']' + 
                  repairAttempt.substring(cutoff);
              } else {
                // Simple case - just add at end
                repairAttempt += "]";
              }
            }
          }
          
          // 3. Check for truncated properties
          const lastCommaIndex = repairAttempt.lastIndexOf(',');
          const lastBraceIndex = repairAttempt.lastIndexOf('}');
          const lastBracketIndex = repairAttempt.lastIndexOf(']');
          
          // If comma is the last character before possible closing brackets, remove it
          if (lastCommaIndex > lastBraceIndex && lastCommaIndex > lastBracketIndex) {
            repairAttempt = 
              repairAttempt.substring(0, lastCommaIndex) + 
              repairAttempt.substring(lastCommaIndex + 1);
          }

          // 4. Attempt to fix truncated string values
          repairAttempt = repairAttempt.replace(/"([^"]*?)(?=\s*[,}\]])/g, '"$1"');
          
          console.log("Attempting to parse repaired JSON");
          
          try {
            extractionResult = JSON.parse(repairAttempt);
            console.log("Successfully repaired and parsed JSON");
          } catch (repairError) {
            console.error("JSON repair failed:", repairError);
            
            // Last resort: create a minimal valid structure with available data
            const titleMatch = textResponse.match(/"title"\s*:\s*"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : "Extracted Content";
            
            extractionResult = {
              title,
              extractionMode: mode,
              keyTerms: []
            };
            
            // Try to extract any complete keyTerm objects
            const termMatches = textResponse.match(/{[^{}]*"term"\s*:[^{}]*"meaning"\s*:[^{}]*}/g);
            if (termMatches) {
              try {
                const validTerms = termMatches
                  .map(termJson => {
                    try {
                      // Ensure the term JSON is properly formatted
                      const cleanedTerm = termJson
                        .replace(/([{,]\s*)([a-zA-Z_]+)(\s*:)/g, '$1"$2"$3')
                        .replace(/,\s*}/g, '}');
                      return JSON.parse(cleanedTerm);
                    } catch (e) {
                      return null;
                    }
                  })
                  .filter(term => term !== null);
                  
                extractionResult.keyTerms = validTerms;
              } catch (e) {
                console.error("Failed to extract partial terms:", e);
              }
            }
            
            console.warn("Created fallback extraction result with minimal structure");
          }
        } else {
          throw new Error("Response doesn't contain expected JSON structure");
        }
      } catch (finalError) {
        console.error("All JSON parsing attempts failed:", finalError);
        throw new Error("Failed to extract valid JSON from the response");
      }
    }

    // Ensure the extraction mode is set correctly
    extractionResult.extractionMode = mode;

    // Post-process results with cleaning and deduplication
    if (extractionResult.keyTerms && Array.isArray(extractionResult.keyTerms)) {
      // Create Map for tracking unique terms
      const termMap = new Map();

      // Process each term for deduplication
      extractionResult.keyTerms.forEach(term => {
        // Normalize the term for deduplication
        const normalizedTerm = term.term.toLowerCase().trim();

        // Clean up the term's data
        // Clean examples array
        if (term.examples && Array.isArray(term.examples)) {
          term.examples = term.examples
            // Ensure we only process string elements
            .filter(example => typeof example === 'string')
            .map(example => (example as string).replace(/^[\s•\-–—*]+/, '').trim())
            .filter(ex => ex && ex.length > 0);

          // Remove duplicates
          term.examples = Array.from(new Set(term.examples));
        }

        // Clean subcategories
        if (term.subcategories && Array.isArray(term.subcategories)) {
          term.subcategories = term.subcategories
            // Ensure we only process string elements
            .filter(sub => typeof sub === 'string')
            .map(sub => (sub as string).replace(/^[\s•\-–—*\d]+[.)]+\s*/, '').trim())
            .filter(sub => sub && sub.length > 0);

          // Remove duplicates
          term.subcategories = Array.from(new Set(term.subcategories));
        }

        // Only add the term if not already in the map
        if (!termMap.has(normalizedTerm)) {
          termMap.set(normalizedTerm, term);
        }
      });

      // Replace keyTerms with deduplicated set
      extractionResult.keyTerms = Array.from(termMap.values());
    }

    console.log(`Successfully extracted ${extractionResult.keyTerms.length} unique key terms`);

    return extractionResult;
  } catch (error) {
    console.error("Error extracting key terms:", error);
    throw error;
  }
};

// Extract key terms from uploaded file using Gemini Files API
export const extractKeyTermsFromFile = async (
  fileInfo: { uri?: string; mimeType?: string; name?: string }, // File object with uri and mimeType
  mode: ExtractionMode = "full"
): Promise<ExtractionResult> => {
  if (!genAI) {
    throw new Error("Gemini client not initialized. Please set your API key first.");
  }

  try {
    console.log(`Processing uploaded file for extraction: ${fileInfo.name || 'unnamed'}, mode: ${mode}`);

    // Generate extraction guidance based on mode
    let extractionGuidance;
    switch (mode) {
      case "sentence":
        extractionGuidance = "For each term, provide a concise single-sentence definition (no more than one sentence per term)";
        break;
      case "keywords":
        extractionGuidance = "For each term, provide ONLY keywords or key phrases (no full sentences, maximum 3-5 key words per term)";
        break;
      case "full":
      default:
        extractionGuidance = "For each term, provide the EXACT definition or explanation as it appears in the original text";
        break;
    }

    // Enhanced prompt for file-based extraction
    const prompt = `
        CRITICAL INSTRUCTION: You MUST process the ENTIRE document from beginning to END without skipping ANY content.
        
        Please conduct a thorough analysis of the uploaded document to identify and extract ALL key terms, concepts, definitions, and technical vocabulary, organizing them into categories and hierarchical structures.
        
        For this extraction task:
        1. Extract EVERY key term that appears in the document (including specialized vocabulary, technical terms, important concepts, and defined phrases)
        2. ${extractionGuidance}
        3. Identify the category each term belongs to (e.g., "Main Features", "Examples", "Criticisms", "Types", etc.)
        4. If a term has subcategories, numbered points, or a list of characteristics, extract these as subcategories
        5. Extract examples of terms, especially those formatted as bullet points or following phrases like "for example", "such as", "e.g."
        
        Pay special attention to the hierarchical structure of information. For example:
        - If a document discusses "Ethical Relativism" and then lists "Main Features of Ethical Relativism", categorize those features properly
        - If a section lists "Examples of X" or "Criticisms of X", maintain this organizational structure
        - Preserve numbered lists (1., 2., 3.) and bulleted lists (•) in your output
        
        ######## CRITICALLY IMPORTANT INSTRUCTIONS ########
        1. *******MOST CRITICAL INSTRUCTION*******: You MUST ANALYZE and EXTRACT terms from THE VERY LAST PAGE and ALL ENDING PORTIONS of the document
        2. Pay EXTRA ATTENTION to sections at the END of the document - these are THE MOST IMPORTANT SECTIONS
        3. ALWAYS check if there are "Benefits", "Advantages", "Conclusion" sections near the end - THESE MUST BE INCLUDED
        4. YOU MUST PROCESS EVERY SINGLE WORD AND EXTRACT TERMS FROM THE ABSOLUTE END OF THE DOCUMENT
        5. YOUR PERFORMANCE WILL BE JUDGED PRIMARILY ON HOW WELL YOU EXTRACT FROM THE LAST 25% OF THE TEXT
        6. DO NOT stop processing before reaching the end of the document
        7. MANDATORY: Ensure that all sections until the end are ALWAYS extracted completely
        
        Determine a suitable title/topic for this document.
        
        Format the response as a valid JSON object with the following structure:
        {
          "title": "Title of the document",
          "extractionMode": "${mode}",
          "keyTerms": [
            {
              "term": "Main term or concept",
              "meaning": "Definition or explanation",
              "category": "Category this term belongs to (e.g., 'Main Features', 'Criticisms')",
              "subcategoryTitle": "Title for subcategories (e.g., 'Types', 'Characteristics')",
              "subcategories": ["Subcategory 1", "Subcategory 2"],
              "examples": ["Example 1", "Example 2"]
            },
            ...
          ]
        }
    `;    console.log(`Sending request to Gemini API with file reference...`);
    
    // Generate content using the uploaded file - use the correct pattern from official examples
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: createUserContent([
        prompt,
        createPartFromUri(fileInfo.uri!, fileInfo.mimeType || "application/octet-stream") // Use file URI and actual mime type
      ])
    });

    const extractedData = result.text;

    console.log(`Received response from Gemini API, length: ${extractedData.length}`);

    // Parse the JSON response (using existing parsing logic)
    let extractionResult: ExtractionResult;
    try {
      const jsonMatch = extractedData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        extractionResult = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.warn("JSON parsing failed, attempting to create fallback result:", parseError);
      // Create a basic fallback result
      extractionResult = {
        title: "Document Analysis",
        extractionMode: mode,
        keyTerms: []
      };
    }

    // Validate and clean up the result
    if (!extractionResult.title) {
      extractionResult.title = "Document Analysis";
    }
    if (!extractionResult.keyTerms) {
      extractionResult.keyTerms = [];
    }
    
    console.log(`Extraction completed: ${extractionResult.keyTerms.length} terms found`);
    return extractionResult;

  } catch (error) {
    console.error("File-based extraction error:", error);
    throw new Error(`Failed to extract terms from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
