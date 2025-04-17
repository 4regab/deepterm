const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Define HarmCategory and HarmBlockThreshold enums locally if not available
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

// Constants for text chunking - aggressively smaller chunks
const MAX_CHUNK_SIZE = 2500; // Further reduced chunk size
const CHUNK_OVERLAP = 150;   // Further reduced overlap

/**
 * Split text into overlapping chunks
 * @param {string} text - The full text to be chunked
 * @returns {Array<string>} - Array of text chunks
 */
function chunkText(text) {
    if (!text || text.length <= MAX_CHUNK_SIZE) {
        return [text];
    }
    const chunks = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, text.length);
        // Simple chunking without complex breakpoint logic for speed
        chunks.push(text.substring(startIndex, endIndex));
        startIndex = Math.max(startIndex, endIndex - CHUNK_OVERLAP);
        if (startIndex >= endIndex) startIndex = endIndex; // Prevent infinite loop
    }
    console.log(`Text chunked into ${chunks.length} segments (size: ${MAX_CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})`);
    return chunks;
}

/**
 * Process multiple chunks sequentially and combine results
 * Highly optimized for speed and memory
 */
async function processChunkedText(model, text, mode) {
    const textChunks = chunkText(text);
    console.log(`Processing ${textChunks.length} chunks sequentially...`);

    if (textChunks.length === 1) {
        // Simplified prompt for single chunk
        const singleChunkPrompt = `Extract key terms from this text as JSON: { "title": "", "keyTerms": [{"term": "", "meaning": "", "category": ""}] }\n\nText:\n${textChunks[0]}`;
        try {
            const result = await model.generateContent(singleChunkPrompt);
            return result; // Return the raw result
        } catch (error) {
            console.error("Error processing single chunk:", error);
            // Return a structured error response
            return { response: { text: () => JSON.stringify({ title: "Error", keyTerms: [{ term: "Processing Error", meaning: error.message, category: "Error" }] }) } };
        }
    }

    const allKeyTerms = [];
    let combinedTitle = "Document Analysis";

    for (let i = 0; i < textChunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${textChunks.length}...`);
        // Extremely simplified prompt for speed
        const chunkPrompt = `Extract key terms from this text section as JSON array: [{"term": "", "meaning": "", "category": ""}]\n\nText:\n${textChunks[i]}`;

        try {
            const result = await model.generateContent(chunkPrompt);
            const textResponse = result.response.text();
            let chunkResult = null;

            // Attempt to parse the response as JSON array
            try {
                // Find the JSON array part
                const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    chunkResult = JSON.parse(jsonMatch[0]);
                }
            } catch (jsonError) {
                console.warn(`Chunk ${i + 1}: Could not parse JSON array directly.`, jsonError.message);
                // Fallback: Try parsing as object containing keyTerms
                try {
                    const objMatch = textResponse.match(/\{[\s\S]*\}/);
                    if (objMatch) {
                        const parsedObj = JSON.parse(objMatch[0]);
                        if (parsedObj && Array.isArray(parsedObj.keyTerms)) {
                            chunkResult = parsedObj.keyTerms;
                            if (i === 0 && parsedObj.title) { // Use title from first chunk if available
                                combinedTitle = parsedObj.title;
                            }
                        }
                    }
                } catch (objParseError) {
                    console.error(`Chunk ${i + 1}: Failed to parse JSON object fallback.`, objParseError.message);
                }
            }

            if (Array.isArray(chunkResult)) {
                allKeyTerms.push(...chunkResult.filter(term => term && term.term)); // Add valid terms
            } else {
                console.warn(`Chunk ${i + 1}: No valid key terms array found in response.`);
                // Add a placeholder if parsing failed but API call succeeded
                allKeyTerms.push({ term: `Chunk ${i + 1} Content (Parse Failed)`, meaning: textResponse.substring(0, 100) + "...", category: "Parsing Issue" });
            }

        } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError);
            allKeyTerms.push({ term: `Chunk ${i + 1} Error`, meaning: chunkError.message, category: "API Error" });
        }
        // Optional: Add a small delay between chunks if rate limits are a concern
        // await new Promise(resolve => setTimeout(resolve, 100)); 
    }

    // Simplified combined result structure
    const combinedResult = {
        title: combinedTitle,
        extractionMode: mode,
        keyTerms: allKeyTerms // Raw combined terms before deduplication
    };

    // Return structure mimicking API response
    return {
        response: {
            text: () => JSON.stringify(combinedResult)
        }
    };
}

// Handler for Netlify serverless function
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }), headers: { 'Content-Type': 'application/json' } };
    }

    try {
        const body = JSON.parse(event.body);
        const { prompt: text, mode = "full", maxRetries = 2 } = body; // Reduced maxRetries

        if (!text) {
            return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing prompt parameter" }), headers: { 'Content-Type': 'application/json' } };
        }

        // API Key loading logic
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
            return { statusCode: 500, body: JSON.stringify({ success: false, error: "API key configuration error." }), headers: { 'Content-Type': 'application/json' } };
        }
        const randomIndex = Math.floor(Math.random() * apiKeys.length);
        const apiKey = apiKeys[randomIndex];

        // Initialize the Gemini model - slightly adjusted config
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite", // Consider trying gemini-1.5-flash if speed is critical
            generationConfig: {
                temperature: 0.2, // Slightly higher for potentially faster response
                maxOutputTokens: 4096, // Further reduced
                topP: 0.95,
                topK: 40,
            },
            safetySettings: [
                { category: LocalHarmCategory.HARM_CATEGORY_HARASSMENT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // Pre-process text (simple cleaning)
        const cleanedText = text.replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ').replace(/\uFFFD/g, ' ');

        // Process the prompt with chunking and retry logic
        let result = null;
        let error = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}: Processing text (length: ${cleanedText.length})`);
                // Use the optimized chunking processor
                result = await processChunkedText(model, cleanedText, mode);
                console.log(`Attempt ${attempt}: Chunk processing finished.`);
                break; // Exit loop on success
            } catch (err) {
                console.error(`Attempt ${attempt} failed:`, err.message);
                error = err;
                if (attempt < maxRetries) {
                    const backoffTime = 1500 * Math.pow(2, attempt); // Slightly longer backoff
                    console.log(`Retrying in ${backoffTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }

        if (!result) {
            console.error("Failed after multiple retries.", error);
            return { statusCode: 500, body: JSON.stringify({ success: false, error: error ? error.message : "Failed after retries" }), headers: { 'Content-Type': 'application/json' } };
        }

        // Extract text from the combined response
        const textResponse = result.response.text();
        console.log("Combined response sample (first 100):", textResponse.substring(0, 100));

        let extractionResult;
        try {
            extractionResult = JSON.parse(textResponse);
            console.log("Successfully parsed combined JSON response.");
        } catch (jsonParseError) {
            console.error("Failed to parse the final combined JSON:", jsonParseError);
            // Attempt to recover if possible, otherwise return error
            return { statusCode: 500, body: JSON.stringify({ success: false, error: "Failed to parse final JSON output.", preview: textResponse.substring(0, 200) }), headers: { 'Content-Type': 'application/json' } };
        }

        // Simplified Post-processing and Deduplication
        if (extractionResult && extractionResult.keyTerms && Array.isArray(extractionResult.keyTerms)) {
            const termMap = new Map();
            extractionResult.keyTerms.forEach(term => {
                if (term && term.term) {
                    const normalizedTerm = term.term.toLowerCase().trim();
                    if (!termMap.has(normalizedTerm)) {
                        // Ensure basic structure
                        term.meaning = term.meaning || "";
                        term.category = term.category || "Uncategorized";
                        term.subcategories = term.subcategories || [];
                        term.examples = term.examples || [];
                        termMap.set(normalizedTerm, term);
                    }
                }
            });
            extractionResult.keyTerms = Array.from(termMap.values());
            console.log(`Deduplicated terms: ${extractionResult.keyTerms.length}`);
        }

        // Ensure extraction mode is set
        if (extractionResult) {
            extractionResult.extractionMode = mode;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: extractionResult }),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        console.error("Critical error in handler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message || "An unknown critical error occurred" }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
