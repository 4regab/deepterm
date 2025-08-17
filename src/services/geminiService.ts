// Import both types and values for proper usage
import { ExtractionResult } from "@/types";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

// Note: Using the unified @google/genai SDK (v1.5.1) which replaces the deprecated @google/generative-ai
// Ensure we're using the correct client for Gemini Files API operations

// Single API key storage
let apiKey: string = "";
let genAI: GoogleGenAI | null = null;

// Initialize from environment variable if available
const initializeFromEnv = (): boolean => {
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envApiKey && envApiKey !== "your_gemini_api_key_here" && envApiKey.length > 0) {
    return initializeGemini(envApiKey);
  }
  return false;
};

// Set user-provided API key and initialize client
export const initializeGemini = (key: string): boolean => {
  if (!key || key.length === 0 || key === "your_gemini_api_key_here") {
    console.warn("No valid API key provided");
    apiKey = "";
    genAI = null;
    return false;
  }
  apiKey = key;
  
  try {
    genAI = new GoogleGenAI({ apiKey: key });
    console.log("API key initialized successfully for Gemini Gen AI SDK");
    
    // Log some debug info about the client
    console.log("GenAI client created:", { 
      hasFiles: !!genAI.files, 
      hasModels: !!genAI.models,
      sdkVersion: "@google/genai v1.5.1"
    });
    
    return true;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    apiKey = "";
    genAI = null;
    return false;
  }
};

// Check if a valid API key exists
export const checkApiKey = (): boolean => {
  // First check if we have an initialized API key
  if (apiKey && apiKey.length > 0 && genAI) {
    return true;
  }
  
  // Try to initialize from environment
  if (initializeFromEnv()) {
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

// Test API key with a simple request to validate it works
export const testApiKey = async (): Promise<{ success: boolean; error?: string; details?: unknown }> => {
  if (!checkApiKey()) {
    return { 
      success: false, 
      error: "No API key configured" 
    };
  }

  try {
    console.log("Testing API key with a simple request...");
    
    // Simple test: try to generate content with text only
    const result = await genAI!.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: "Just respond with 'API test successful'"
    });
    
    const response = result.text;
    console.log("API test response:", response);
    
    return { 
      success: true, 
      details: { 
        response: response,
        model: "gemini-2.5-flash-preview-05-20"
      }
    };
  } catch (error) {
    console.error("API key test failed:", error);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
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
    console.log(`File details:`, {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Validate file before upload
    if (!file.type) {
      console.warn("File has no MIME type, attempting to infer from extension");
    }
    
    // Enhanced handling for Office documents - DOCX requires special attention
    let mimeType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === '.docx') {
      // Force the correct MIME type for DOCX files
      const correctDocxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
        console.log(`[DOCX Fix] Correcting MIME type from "${mimeType}" to "${correctDocxMimeType}"`);
        mimeType = correctDocxMimeType;
      }
      
      // Additional DOCX file validation
      console.log(`[DOCX] Processing DOCX file: ${file.name}, size: ${file.size} bytes`);
      
      // Check file size - very large DOCX files might cause issues
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error("DOCX file is too large (>50MB). Please use a smaller document.");
      }
      
      // Check if file is actually a DOCX (basic validation)
      if (file.size < 100) {
        throw new Error("DOCX file appears to be corrupted or empty.");
      }
      
    } else if (fileExtension === '.doc') {
      const correctDocMimeType = 'application/msword';
      if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
        console.log(`[DOC Fix] Correcting MIME type from "${mimeType}" to "${correctDocMimeType}"`);
        mimeType = correctDocMimeType;
      }
    }
    
    console.log(`[Upload] Using MIME type: "${mimeType}" for file: ${file.name}`);
    
    // Try the upload with more explicit error handling for different potential issues
    let uploadResult;
    
    try {
      // Primary approach: Use the current SDK pattern
      console.log("Attempting upload with @google/genai SDK pattern...");
      uploadResult = await genAI.files.upload({
        file: file,  // File/Blob object directly
        config: {
          mimeType: mimeType, // Use corrected MIME type
          displayName: file.name
        }
      });
    } catch (primaryError) {
      console.error("Primary upload method failed:", primaryError);
      
      // Log detailed error for analysis
      if (primaryError && typeof primaryError === 'object') {
        console.error("Error details:", {
          message: primaryError instanceof Error ? primaryError.message : 'Unknown message',
          status: 'status' in (primaryError as object) ? (primaryError as { status: unknown }).status : 'unknown',
          code: 'code' in (primaryError as object) ? (primaryError as { code: unknown }).code : 'unknown',
          stack: primaryError instanceof Error ? primaryError.stack : 'No stack trace'
        });
      }
      
      // Re-throw the original error with more context
      const status = 'status' in (primaryError as object) ? (primaryError as { status: unknown }).status : 'unknown status';
      const message = primaryError instanceof Error ? primaryError.message : String(primaryError);
      throw new Error(`File upload failed with ${status}: ${message}`);
    }
    
    // Validate that the upload result has required properties
    if (!uploadResult) {
      throw new Error("Upload failed: No result returned from Gemini Files API");
    }
    
    if (!uploadResult.uri) {
      throw new Error("Upload successful but no URI returned from Gemini Files API");
    }
    
    if (!uploadResult.mimeType) {
      throw new Error("Upload successful but no mimeType returned from Gemini Files API");
    }
    
    console.log(`File uploaded successfully:`, {
      name: uploadResult.name,
      uri: uploadResult.uri,
      mimeType: uploadResult.mimeType,
      sizeBytes: uploadResult.sizeBytes,
      state: uploadResult.state
    });
    
    // Special handling for DOCX files - they may need extra processing time
    if (fileExtension === '.docx' && uploadResult.state === 'PROCESSING') {
      console.log(`[DOCX] File is still processing, waiting for completion...`);
      
      // Wait longer for DOCX files as they may need more processing time
      let retries = 0;
      const maxRetries = 10;
      
      while (uploadResult.state === 'PROCESSING' && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        try {
          // Check file status
          const fileInfo = await genAI.files.get({ name: uploadResult.name! });
          if (fileInfo.state) {
            uploadResult.state = fileInfo.state;
          }
          console.log(`[DOCX] File state check #${retries + 1}: ${uploadResult.state}`);
        } catch (statusError) {
          console.warn(`[DOCX] Could not check file status:`, statusError);
          break;
        }
        
        retries++;
      }
      
      if (uploadResult.state === 'PROCESSING') {
        console.warn(`[DOCX] File still processing after ${maxRetries * 2} seconds, proceeding anyway...`);
      } else if (uploadResult.state === 'FAILED') {
        throw new Error(`DOCX file processing failed. The file may be corrupted or in an unsupported format.`);
      } else if (uploadResult.state === 'ACTIVE') {
        console.log(`[DOCX] File processing completed successfully.`);
      }
    }
    
    return uploadResult; // Return complete file object with uri and mimeType
  } catch (error) {
    console.error("File upload failed - detailed error:", error);
    
    // Log additional error details if available
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check if it's an API error with status code
    if (error && typeof error === 'object' && 'status' in error) {
      console.error("API Error status:", (error as any).status);
    }
    
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
    }    
    
    // Extract JSON from the response with proper null checking
    const textResponse = result?.text;
    if (!textResponse) {
      throw new Error("No text content received from Gemini API");
    }

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
            const title = titleMatch?.[1] ?? "Extracted Content";
            
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
    
    // Validate fileInfo has required properties
    if (!fileInfo.uri) {
      throw new Error("File URI is required but not provided");
    }
    
    if (!fileInfo.mimeType) {
      throw new Error("File mimeType is required but not provided");
    }
    
    console.log(`File details - URI: ${fileInfo.uri}, MIME Type: ${fileInfo.mimeType}`);

    // Check if this is a DOCX file and apply special handling
    const isDocxFile = fileInfo.mimeType.includes('wordprocessingml') || 
                       fileInfo.name?.toLowerCase().endsWith('.docx');
    
    if (isDocxFile) {
      console.log(`[DOCX] Detected DOCX file, applying specialized extraction approach...`);
    }

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

    // Use a simpler, more robust prompt for DOCX files
    const prompt = isDocxFile ? `
Please read the uploaded document and extract key terms and their definitions.

${extractionGuidance}

Return the result as a JSON object with this exact structure:
{
  "title": "Document title or name",
  "extractionMode": "${mode}",
  "keyTerms": [
    {
      "term": "Term name",
      "meaning": "Definition",
      "category": "Category",
      "subcategories": [],
      "examples": []
    }
  ]
}

Focus on the main content and important terms. If the document is complex, extract the most significant concepts.
    ` : `
Please analyze the uploaded document and extract all key terms, concepts, and definitions.

${extractionGuidance}

Format the response as a valid JSON object with this structure:
{
  "title": "Document title",
  "extractionMode": "${mode}",
  "keyTerms": [
    {
      "term": "Key term or concept",
      "meaning": "Definition or explanation",
      "category": "Category name",
      "subcategories": ["item1", "item2"],
      "examples": ["example1", "example2"]
    }
  ]
}

Extract ALL terms from the entire document, paying special attention to sections at the end.
    `;    console.log(`Sending request to Gemini API with file reference...`);
    console.log(`Request details:`, {
      model: "gemini-2.5-flash",
      fileUri: fileInfo.uri,
      fileMimeType: fileInfo.mimeType,
      promptLength: prompt.length,
      isDocxFile: isDocxFile
    });
    
    // Generate content using the uploaded file - use the correct pattern from official examples
    // IMPORTANT: File part must come FIRST, then the text prompt
    let result;
    let lastError;
    
    // For DOCX files, try multiple approaches
    const modelsToTry = isDocxFile ? 
      ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"] : 
      ["gemini-2.5-flash", "gemini-1.5-flash"];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[${isDocxFile ? 'DOCX' : 'FILE'}] Attempting with ${modelName} model...`);
        
        result = await genAI.models.generateContent({
          model: modelName,
          contents: createUserContent([
            createPartFromUri(fileInfo.uri!, fileInfo.mimeType!), // File FIRST
            prompt // Text prompt SECOND
          ])
        });
        
        console.log(`✅ Content generation successful with ${modelName}`);
        break; // Success, exit the loop
        
      } catch (apiError) {
        console.error(`❌ ${modelName} failed:`, apiError);
        lastError = apiError;
        
        // For DOCX files, if we get INVALID_ARGUMENT, try a different approach
        if (isDocxFile && apiError && typeof apiError === 'object' && 
            ((apiError as any).status === 400 || (apiError as any).message?.includes('INVALID_ARGUMENT'))) {
          
          console.log(`[DOCX] Trying alternative prompt structure for ${modelName}...`);
          
          try {
            // Try with a much simpler prompt
            const simplePrompt = `Extract key terms and definitions from this document. Return as JSON: {"title": "Document", "keyTerms": [{"term": "name", "meaning": "definition"}]}`;
            
            result = await genAI.models.generateContent({
              model: modelName,
              contents: createUserContent([
                createPartFromUri(fileInfo.uri!, fileInfo.mimeType!),
                simplePrompt
              ])
            });
            
            console.log(`✅ DOCX extraction successful with simplified prompt and ${modelName}`);
            break;
            
          } catch (simpleError) {
            console.error(`❌ Simple prompt also failed with ${modelName}:`, simpleError);
            lastError = simpleError;
          }
        }
        
        // If this is the last model to try, we'll throw the error below
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          break;
        }
        
        // Wait a bit before trying the next model
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If no model succeeded, throw the last error
    if (!result) {
      console.error(`❌ All models failed for ${isDocxFile ? 'DOCX' : 'file'} extraction:`, lastError);
      
      // Special error message for DOCX files
      if (isDocxFile) {
        throw new Error(`DOCX file extraction failed. This might be due to:\n1. Complex document structure\n2. Large file size\n3. Protected/encrypted content\n4. Unsupported DOCX features\n\nTry saving as PDF or plain text for better compatibility.`);
      } else {
        throw new Error(`Content generation failed with all models: ${(lastError as any)?.message || lastError}`);
      }
    }

    const extractedData = result.text;
    if (!extractedData) {
      throw new Error("No text content received from Gemini API");
    }

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

// Test file upload capability with a simple test file
export const testFileUpload = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  if (!checkApiKey()) {
    return { 
      success: false, 
      error: "No API key configured" 
    };
  }

  try {
    console.log("Testing file upload capability...");
    
    // Create a simple test file (plain text)
    const testContent = "This is a test file for Gemini Files API upload capability testing.";
    const testFile = new File([testContent], "test.txt", { type: "text/plain" });
    
    console.log("Created test file:", {
      name: testFile.name,
      type: testFile.type,
      size: testFile.size
    });
    
    // Test the upload
    const uploadResult = await uploadFileToGemini(testFile);
    
    console.log("Test file upload successful:", uploadResult);
    
    // Clean up the test file
    try {
      if (uploadResult.name) {
        await deleteFileFromGemini(uploadResult.name);
        console.log("Test file cleaned up successfully");
      }
    } catch (cleanupError) {
      console.warn("Failed to clean up test file:", cleanupError);
    }
    
    return { 
      success: true, 
      details: {
        uploadResult: uploadResult,
        message: "File upload capability confirmed"
      }
    };
  } catch (error) {
    console.error("File upload test failed:", error);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
};
