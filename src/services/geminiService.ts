import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ExtractionResult } from "@/types";

// Support for multiple API keys (up to 10)
const MAX_API_KEYS = 10;
let apiKeys: string[] = [];
let currentKeyIndex = 0;

// Initialize API keys from environment variables
const loadApiKeysFromEnv = () => {
  apiKeys = [];
  for (let i = 1; i <= MAX_API_KEYS; i++) {
    const key = import.meta.env[`VITE_GEMINI_API_KEY_${i}`] || "";
    if (key && key.length > 0 && key !== "your_gemini_api_key_here") {
      apiKeys.push(key);
    }
  }
  console.log(`Loaded ${apiKeys.length} API keys from environment variables`);
  currentKeyIndex = 0;
};

// Load API keys on module initialization
loadApiKeysFromEnv();

export const initializeGemini = (keys: string[]) => {
  if (!keys || !keys.length) {
    console.warn("No API keys provided to initialize");
    return;
  }
  
  // Filter out empty keys
  const validKeys = keys.filter(key => key && key.length > 0 && key !== "your_gemini_api_key_here");
  
  if (validKeys.length === 0) {
    console.warn("No valid API keys provided");
    return;
  }
  
  // Replace existing keys with new ones
  apiKeys = validKeys;
  console.log(`Initialized with ${apiKeys.length} API keys`);
  
  // Reset current key index
  currentKeyIndex = 0;
};

export const checkApiKey = (): boolean => {
  return apiKeys.length > 0;
};

// Get the current API key
const getCurrentApiKey = (): string => {
  if (apiKeys.length === 0) return "";
  return apiKeys[currentKeyIndex];
};

// Rotate to the next API key
const rotateToNextApiKey = (): string => {
  if (apiKeys.length === 0) return "";
  
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  const key = apiKeys[currentKeyIndex];
  console.log(`Rotated to API key ${currentKeyIndex + 1}/${apiKeys.length}`);
  return key;
};

// Reset to first API key
const resetApiKeyRotation = (): void => {
  currentKeyIndex = 0;
};

export type ExtractionMode = "full" | "sentence" | "keywords";

// Maximum text length to process in one request
const MAX_TEXT_LENGTH = 100000;

export const extractKeyTerms = async (
  text: string, 
  mode: ExtractionMode = "full"
): Promise<ExtractionResult> => {
  if (!checkApiKey()) {
    throw new Error("No valid API keys available. Please initialize with valid API keys first.");
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
      .replace(/�/g, ' '); // Replace replacement character
      
    // Log a sample to ensure text is clean
    console.log(`Cleaned text sample (first 100 chars): ${cleanedText.substring(0, 100)}...`);
    console.log(`Cleaned text sample (last 100 chars): ${cleanedText.substring(cleanedText.length - 100)}`);
    
    // Enhanced retry mechanism with API key rotation
    let result;
    let allKeysFailed = true;
    
    // Try each API key in sequence until we get a success or run out of keys
    for (let keyAttempt = 0; keyAttempt < apiKeys.length; keyAttempt++) {
      const currentApiKey = getCurrentApiKey();
      console.log(`Trying API key ${currentKeyIndex + 1}/${apiKeys.length}`);
      
      if (!currentApiKey) {
        console.error("Current API key is invalid");
        rotateToNextApiKey();
        continue;
      }
      
      // Create a new model instance with the current API key
      const genAI = new GoogleGenerativeAI(currentApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro-exp-03-25",
        generationConfig: {
          temperature: 0.1,             // Lower temperature for more deterministic extraction
          maxOutputTokens: 100000,      // Maximized output tokens limit
          topP: 0.99,                   // Increased to consider wider range of tokens
          topK: 100,                    // Significantly increased for better coverage
        },
        // Safety settings set to maximum permissiveness
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });
      
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
        
        Determine a suitable title/topic for this text.
        
        Format the response as a valid JSON object with the following structure:
        {
          "title": "Title of the text",
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
        
        Text to analyze:
        ${cleanedText}
      `;

      // Log that we're sending the prompt to Gemini
      console.log(`Sending prompt to Gemini API with key ${currentKeyIndex + 1}`);
      
      // Retry logic for the current API key
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          result = await model.generateContent(prompt);
          console.log(`Successfully processed content using API key ${currentKeyIndex + 1} on attempt ${retryCount + 1}`);
          
          // If we succeed, set the flag and break out of the retry loop
          allKeysFailed = false;
          break;
        } catch (error) {
          retryCount++;
          console.error(`Error on attempt ${retryCount} with API key ${currentKeyIndex + 1}:`, error);
          
          if (retryCount >= maxRetries) {
            console.log(`API key ${currentKeyIndex + 1} failed after ${maxRetries} attempts`);
            break;
          }
          
          // Wait before retrying with exponential backoff
          const backoffTime = 1000 * Math.pow(2, retryCount);
          console.log(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
      
      // If the current key succeeded, break out of the key rotation loop
      if (!allKeysFailed) {
        break;
      }
      
      // If we reach here, the current key failed all retries, so rotate to the next key
      rotateToNextApiKey();
    }
    
    // If all keys failed, throw an error
    if (allKeysFailed) {
      throw new Error("All API keys failed. Please check your API keys and try again.");
    }
    
    // Extract JSON from the response
    const response = result!.response;
    const textResponse = response.text();
    
    console.log(`Received response from Gemini, length: ${textResponse.length}`);
    
    // Extract JSON from the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("JSON extraction failed. Response:", textResponse.substring(0, 200));
      throw new Error("Failed to extract JSON from the response");
    }
    
    const jsonString = jsonMatch[0];
    
    // Validate JSON before parsing
    try {
      JSON.parse(jsonString);
    } catch (error) {
      console.error("Invalid JSON received:", jsonString.substring(0, 200));
      throw new Error("Invalid JSON in the response");
    }
    
    const extractionResult: ExtractionResult = JSON.parse(jsonString);
    
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
            .map(example => example.replace(/^[\s•\-–—*]+/, '').trim())
            .filter(ex => ex && ex.length > 0);
            
          // Remove duplicates
          term.examples = Array.from(new Set(term.examples));
        }
        
        // Clean subcategories
        if (term.subcategories && Array.isArray(term.subcategories)) {
          term.subcategories = term.subcategories
            .map(sub => sub.replace(/^[\s•\-–—*\d]+[.)]+\s*/, '').trim())
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
    
    // Reset to the first key for the next operation if we had to rotate
    if (currentKeyIndex !== 0) {
      resetApiKeyRotation();
    }
    
    return extractionResult;
  } catch (error) {
    console.error("Error extracting key terms:", error);
    throw error;
  }
};

export const extractKeyTermsFromFile = async (
  fileContent: string, 
  mode: ExtractionMode = "full"
): Promise<ExtractionResult> => {
  return extractKeyTerms(fileContent, mode);
};