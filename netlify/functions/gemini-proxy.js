const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Define HarmCategory and HarmBlockThreshold enums locally if not available
// (These should match the actual values from the library)
const LocalHarmCategory = {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT'
};

const LocalHarmBlockThreshold = {
    BLOCK_NONE: 'BLOCK_NONE',
    BLOCK_LOW_AND_ABOVE: 'BLOCK_LOW_AND_ABOVE',
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH'
};

// Constants for text chunking
const MAX_CHUNK_SIZE = 12000; // Maximum characters per chunk
const CHUNK_OVERLAP = 1000;   // Overlap between chunks to maintain context

/**
 * Split text into overlapping chunks to avoid API limits and timeouts
 * @param {string} text - The full text to be chunked
 * @returns {Array<string>} - Array of text chunks with overlap
 */
function chunkText(text) {
    if (!text || text.length <= MAX_CHUNK_SIZE) {
        return [text];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        // Calculate end index for current chunk
        let endIndex = startIndex + MAX_CHUNK_SIZE;
        
        // If not at the end of text, find a good breakpoint (newline or period)
        if (endIndex < text.length) {
            // Try to find a natural breakpoint within the last 20% of the chunk
            const breakpointSearchStart = Math.max(startIndex + MAX_CHUNK_SIZE * 0.8, startIndex);
            const breakpointSearchEnd = Math.min(endIndex + 200, text.length);
            const textSegment = text.substring(breakpointSearchStart, breakpointSearchEnd);
            
            // Look for paragraph breaks or sentence ends
            const newlineMatch = textSegment.match(/\n+/);
            const periodMatch = textSegment.match(/\.\s+/);
            
            if (newlineMatch) {
                endIndex = breakpointSearchStart + newlineMatch.index + newlineMatch[0].length;
            } else if (periodMatch) {
                endIndex = breakpointSearchStart + periodMatch.index + periodMatch[0].length;
            }
        } else {
            // If we're processing the last chunk, just use the end of text
            endIndex = text.length;
        }
        
        // Add this chunk to our results
        chunks.push(text.substring(startIndex, endIndex));
        
        // Move start position for next chunk, including overlap
        startIndex = Math.max(startIndex, endIndex - CHUNK_OVERLAP);
        
        // If we can't make progress, prevent infinite loop
        if (startIndex >= endIndex) {
            startIndex = endIndex;
        }
    }

    console.log(`Text chunked into ${chunks.length} segments`);
    return chunks;
}

/**
 * Process multiple chunks of text and combine their results
 */
async function processChunkedText(model, finalPromptTemplate, text, mode) {
    // Split the text into manageable chunks
    const textChunks = chunkText(text);
    console.log(`Processing ${textChunks.length} chunks of text`);
    
    // If there's only one chunk, process normally
    if (textChunks.length === 1) {
        const prompt = finalPromptTemplate.replace('${cleanedText}', textChunks[0]);
        const result = await model.generateContent(prompt);
        return result;
    }
    
    // For multiple chunks, we'll process each and combine results
    const allResults = [];
    
    for (let i = 0; i < textChunks.length; i++) {
        console.log(`Processing chunk ${i+1} of ${textChunks.length} (${textChunks[i].length} chars)`);
        
        // Create a chunk-specific prompt
        const chunkPrompt = `
            CONTEXT: This is part ${i+1} of ${textChunks.length} of a larger document that has been split for processing.
            
            ${finalPromptTemplate.replace('${cleanedText}', textChunks[i])}
            
            IMPORTANT: Remember this is just part ${i+1} of ${textChunks.length}, so focus on extracting terms from THIS SECTION only.
        `;
        
        try {
            const result = await model.generateContent(chunkPrompt);
            const textResponse = result.response.text();
            
            // Try to parse the JSON response
            try {
                const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const chunkResult = JSON.parse(jsonMatch[0]);
                    if (chunkResult && chunkResult.keyTerms) {
                        allResults.push(...chunkResult.keyTerms);
                    }
                }
            } catch (jsonError) {
                console.error(`Error parsing JSON for chunk ${i+1}:`, jsonError);
            }
        } catch (chunkError) {
            console.error(`Error processing chunk ${i+1}:`, chunkError);
        }
    }
    
    // Create a combined result
    const combinedResult = {
        title: `Combined Results from ${textChunks.length} Document Parts`,
        extractionMode: mode,
        keyTerms: allResults
    };
    
    // Create a fake API response structure to match the expected format
    return {
        response: {
            text: () => JSON.stringify(combinedResult)
        }
    };
}

// Handler for Netlify serverless function
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        // Default mode to 'full' if not provided
        const { prompt: text, mode = "full", maxRetries = 3 } = body;

        if (!text) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: "Missing prompt parameter"
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Get API key from Netlify environment variables
        const apiKeys = [];
        const envVarNames = [];

        for (let i = 1; i <= 10; i++) {
            const varName = `GEMINI_API_KEY_${i}`;
            envVarNames.push(varName);
            const key = process.env[varName];
            if (key && key.trim() !== '') {
                apiKeys.push(key);
            }
        }

        if (apiKeys.length === 0) {
            console.error(`No API keys found. Checked environment variables: ${envVarNames.join(', ')}`);
            console.error(`Available environment variables: ${Object.keys(process.env).filter(key => !key.includes('SECRET')).join(', ')}`);

            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: "API key configuration error. Please add GEMINI_API_KEY_1 in Netlify environment variables."
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Simple rotation strategy
        const randomIndex = Math.floor(Math.random() * apiKeys.length);
        const apiKey = apiKeys[randomIndex];

        // Initialize the Gemini model
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro-exp-03-25", // Ensure this model is correct
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 100000, // Consider if this needs adjustment per mode
                topP: 0.99,
                topK: 100,
            },
            safetySettings: [
                {
                    category: LocalHarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: LocalHarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: LocalHarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: LocalHarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: LocalHarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: LocalHarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: LocalHarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: LocalHarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        // --- Start: Mode-specific prompt generation ---
        let extractionGuidance = "";
        let jsonStructureExample = `
            {
              "term": "Main term or concept",
              "meaning": "Definition or explanation",
              "category": "Category this term belongs to (e.g., 'Main Features', 'Criticisms')",
              "subcategoryTitle": "Title for subcategories (e.g., 'Types', 'Characteristics')",
              "subcategories": ["Subcategory 1", "Subcategory 2"],
              "examples": ["Example 1", "Example 2"]
            }`; // Default structure

        switch (mode) {
            case "sentence":
                extractionGuidance = "For each term, provide ONLY ONE SENTENCE as the definition or explanation in the 'meaning' field. Keep it brief and concise.";
                // JSON structure remains the same, but 'meaning' content changes
                break;
            case "keywords":
                extractionGuidance = "For each term, extract ONLY the IMPORTANT KEY WORDS related to it. Place these keywords as a comma-separated string in the 'meaning' field. Format example for meaning field: 'keyword1, keyword2, keyword3'. IMPORTANT: EVERY term MUST have at least 3-5 keywords. Do not include full sentences in the 'meaning' field for this mode.";
                // Adjust JSON example slightly for clarity, though structure is the same
                jsonStructureExample = `
            {
              "term": "Main term or concept",
              "meaning": "keyword1, keyword2, keyword3", // Comma-separated keywords ONLY
              "category": "Category this term belongs to",
              "subcategoryTitle": "Title for subcategories",
              "subcategories": [], // Often empty in keywords mode
              "examples": [] // Often empty in keywords mode
            }`;
                break;
            case "full":
            default:
                extractionGuidance = "For each term, provide the EXACT definition or explanation as it appears in the original text in the 'meaning' field.";
                break;
        }

        // Pre-process text (optional but recommended)
        const cleanedText = text
            .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ') // Replace control chars
            .replace(/\uFFFD/g, ' '); // Replace Unicode replacement character (U+FFFD)

        // Construct the final prompt template (without actual text insertion)
        const finalPromptTemplate = `
            CRITICAL INSTRUCTION: You MUST process the ENTIRE text from beginning to END without skipping ANY content.

            Please conduct a thorough analysis of the following text to identify and extract ALL key terms, concepts, definitions, and technical vocabulary, organizing them into categories and hierarchical structures.

            For this extraction task:
            1. Extract EVERY key term that appears in the text (including specialized vocabulary, technical terms, important concepts, and defined phrases)
            2. ${extractionGuidance}
            3. Identify the category each term belongs to (e.g., "Main Features", "Examples", "Criticisms", "Types", etc.)
            4. If a term has subcategories, numbered points, or a list of characteristics, extract these as subcategories
            5. Extract examples of terms, especially those formatted as bullet points or following phrases like "for example", "such as", "e.g." (unless in 'keywords' mode where examples might be omitted).

            Pay special attention to the hierarchical structure of information. For example:
            - If a document discusses "Ethical Relativism" and then lists "Main Features of Ethical Relativism", categorize those features properly
            - If a section lists "Examples of X" or "Criticisms of X", maintain this organizational structure
            - Preserve numbered lists (1., 2., 3.) and bulleted lists (•) in your output where appropriate for the mode.

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
                ${jsonStructureExample}
                ,
                ...
              ]
            }

            Text to analyze:
            \${cleanedText}
          `;
        // --- End: Mode-specific prompt generation ---

        // Process the prompt with chunking and retry logic
        let result = null;
        let error = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}: Processing text (mode: ${mode}, length: ${cleanedText.length}) with chunking`);
                
                // Use the text chunking processor instead of direct API call
                result = await processChunkedText(model, finalPromptTemplate, cleanedText, mode);
                
                console.log(`Attempt ${attempt}: Success!`);
                break; // Exit the retry loop on success
            } catch (err) {
                console.error(`Attempt ${attempt} failed:`, err.message);
                error = err;

                if (attempt < maxRetries) {
                    // Exponential backoff between retries
                    const backoffTime = 1000 * Math.pow(2, attempt);
                    console.log(`Retrying in ${backoffTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }

        if (!result) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: error ? error.message : "Failed to generate content after multiple attempts"
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Extract text from response
        const response = result.response;
        const textResponse = response.text();

        console.log("API Response sample (first 200 chars):", textResponse.substring(0, 200));
        console.log("API Response sample (last 200 chars):", textResponse.substring(Math.max(0, textResponse.length - 200)));

        // Define extraction result variable
        let extractionResult;

        // First try to directly parse if the response is already valid JSON
        try {
            extractionResult = JSON.parse(textResponse);
            console.log("Successfully parsed response as direct JSON");
        } catch (jsonParseError) {
            // If direct parsing fails, try to extract JSON using regex
            console.log("Direct JSON parsing failed, trying to extract JSON with regex");
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                // Log the error with more context
                console.error("Failed to extract JSON. Response length:", textResponse.length);
                console.error("Response format appears invalid");

                // Try to construct a valid response from text if possible
                if (textResponse.length > 0) {
                    try {
                        // Create a simple extraction result from the text
                        return {
                            statusCode: 200,
                            body: JSON.stringify({
                                success: true,
                                data: {
                                    title: "Extracted Content",
                                    extractionMode: mode,
                                    keyTerms: [
                                        {
                                            term: "API Response",
                                            meaning: textResponse.substring(0, 500) + (textResponse.length > 500 ? "..." : ""),
                                            category: "API Result"
                                        }
                                    ]
                                }
                            }),
                            headers: { 'Content-Type': 'application/json' }
                        };
                    } catch (fallbackError) {
                        console.error("Fallback extraction failed:", fallbackError);
                    }
                }

                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        success: false,
                        error: "Failed to extract JSON from the response",
                        responsePreview: textResponse.substring(0, 100) + "..."
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
            }

            const jsonString = jsonMatch[0];

            // Validate JSON before parsing
            try {
                extractionResult = JSON.parse(jsonString);
                console.log("Successfully parsed extracted JSON");
            } catch (err) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        success: false,
                        error: "Invalid JSON in the response",
                        jsonPreview: jsonString.substring(0, 100) + "..."
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
            }
        }

        // Ensure the extraction mode is set correctly
        if (extractionResult) { // Check if extractionResult exists before modifying
            extractionResult.extractionMode = mode;
        }


        // Post-process and deduplicate results
        if (extractionResult && extractionResult.keyTerms && Array.isArray(extractionResult.keyTerms)) { // Check extractionResult exists
            const termMap = new Map();

            extractionResult.keyTerms.forEach(term => {
                if (!term || !term.term) return; // Skip invalid entries
                
                const normalizedTerm = term.term.toLowerCase().trim();

                // Clean up the term's data
                if (term.examples && Array.isArray(term.examples)) {
                    term.examples = [...new Set(
                        term.examples
                            // Ensure example is a string before calling replace/trim
                            .map(example => typeof example === 'string' ? example.replace(/^[\s•\-–—*]+/, '').trim() : '')
                            .filter(ex => ex && ex.length > 0)
                    )];
                }

                // Clean up subcategories - MORE ROBUST CHECK
                if (term.subcategories && Array.isArray(term.subcategories)) {
                    console.log(`Processing subcategories for term "${term.term}":`, JSON.stringify(term.subcategories)); // Log the raw subcategories
                    const cleanedSubcategories = term.subcategories.map(sub => {
                        console.log(`  - Processing sub: ${JSON.stringify(sub)}, Type: ${typeof sub}`); // Log each sub-item
                        if (typeof sub === 'string' && sub.trim().length > 0) {
                            try {
                                // Only attempt replace/trim if it's definitely a non-empty string
                                return sub.replace(/^[\\s•\\-–—*\\d]+[.)]+\\s*/, '').trim();
                            } catch (e) {
                                console.error(`Error processing string subcategory '${sub}':`, e);
                                return ''; // Return empty string on error during processing
                            }
                        }
                        // For non-strings or empty strings, return null to be filtered out later
                        return null;
                    }).filter(sub => sub !== null && sub.length > 0); // Filter out nulls and now-empty strings

                    term.subcategories = [...new Set(cleanedSubcategories)];
                    console.log(`Cleaned subcategories for term "${term.term}":`, JSON.stringify(term.subcategories)); // Log the result
                } else {
                    // Ensure term.subcategories is an empty array if it wasn't valid
                    term.subcategories = [];
                }

                // Merge duplicate terms, favoring the one with more complete information
                if (!termMap.has(normalizedTerm)) {
                    termMap.set(normalizedTerm, term);
                } else {
                    const existingTerm = termMap.get(normalizedTerm);
                    
                    // Merge examples and subcategories if the new term has them
                    if (term.examples && term.examples.length > 0) {
                        if (!existingTerm.examples) existingTerm.examples = [];
                        existingTerm.examples = [...new Set([...existingTerm.examples, ...term.examples])];
                    }
                    
                    if (term.subcategories && term.subcategories.length > 0) {
                        if (!existingTerm.subcategories) existingTerm.subcategories = [];
                        existingTerm.subcategories = [...new Set([...existingTerm.subcategories, ...term.subcategories])];
                    }
                    
                    // If new term has a meaning and existing one doesn't, use the new one
                    if (term.meaning && (!existingTerm.meaning || existingTerm.meaning.length < term.meaning.length)) {
                        existingTerm.meaning = term.meaning;
                    }
                }
            });

            extractionResult.keyTerms = Array.from(termMap.values());
        }
        
        // Ensure the returned data has the expected structure for ResultsDisplay
        if (extractionResult && !extractionResult.keyTerms) { // Check extractionResult exists
            extractionResult.keyTerms = [];
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: extractionResult
            }),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message || "An unknown error occurred"
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
