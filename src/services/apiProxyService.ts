/**
 * API Proxy Service for DeepTerm
 * 
 * This service handles secure API requests via a Netlify function.
 * It now orchestrates chunking and sequential requests on the client-side.
 */

// Constants for text chunking (client-side) - smaller chunks to prevent memory issues
const MAX_CHUNK_SIZE = 1000; // Reduced from 2500 to avoid memory issues
const CHUNK_OVERLAP = 100;   // Reduced from 150 to save memory

// Types for the proxy service
type ProxyRequestOptions = {
    prompt: string; // Full text prompt
    mode?: string;
    onProgress?: (progress: number, total: number) => void; // Optional progress callback
};

// Type for the expected response from the simplified Netlify function
type ChunkApiResponse = {
    success: boolean;
    data?: { keyTerms?: KeyTerm[] }; // Expecting { keyTerms: [...] } inside data
    error?: string;
    responsePreview?: string; // For debugging errors
};

// Define KeyTerm type if not already globally available
interface KeyTerm {
    term: string;
    meaning: string;
    category: string;
    subcategories?: string[];
    examples?: string[];
}

// Error type for API errors
interface ApiError extends Error {
    message: string;
}

// Export the ProxyResponse type (structure for the final combined result)
export type ProxyResponse = {
    success: boolean;
    data?: {
        title: string;
        extractionMode: string;
        keyTerms: KeyTerm[];
    };
    error?: string;
};

/**
 * Split text into overlapping chunks (client-side version)
 * @param {string} text - The full text to be chunked
 * @returns {Array<string>} - Array of text chunks
 */
function chunkText(text: string): string[] {
    if (!text || text.length <= MAX_CHUNK_SIZE) {
        return [text];
    }
    const chunks: string[] = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, text.length);
        chunks.push(text.substring(startIndex, endIndex));
        startIndex = Math.max(startIndex, endIndex - CHUNK_OVERLAP);
        if (startIndex >= endIndex) startIndex = endIndex; // Prevent infinite loop
    }
    console.log(`Client-side: Text chunked into ${chunks.length} segments`);
    return chunks;
}

/**
 * Send text to Gemini API via Netlify proxy, handling chunking client-side.
 * @param options - The request options including full prompt, mode, and progress callback
 * @returns Promise with the combined extraction result
 */
export const sendSecureGeminiRequest = async (options: ProxyRequestOptions): Promise<ProxyResponse> => {
    const { prompt, mode = 'full', onProgress } = options;
    const allKeyTerms: KeyTerm[] = [];
    let overallSuccess = true;
    let firstError: string | null = null;

    try {
        // 1. Chunk the text
        const textChunks = chunkText(prompt);
        const totalChunks = textChunks.length;

        // 2. Process each chunk sequentially
        for (let i = 0; i < totalChunks; i++) {
            const chunk = textChunks[i];
            console.log(`Client: Sending chunk ${i + 1}/${totalChunks} to proxy...`);

            try {
                // Prepare request for a single chunk - IMPORTANT: Using "prompt" as parameter name to match server expectation
                const config = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: chunk, // Send the chunk using "prompt" parameter name
                        mode: mode,
                    }),
                };

                // Make the call to the Netlify function
                const response = await fetch('/.netlify/functions/gemini-proxy', config);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Client: Error response from proxy for chunk ${i + 1}: ${response.status}`, errorText);
                    throw new Error(`Proxy error (Chunk ${i + 1}/${totalChunks}): ${response.status} - ${errorText.substring(0, 100)}`);
                }

                const result: ChunkApiResponse = await response.json();

                if (!result.success || !result.data || !result.data.keyTerms) {
                    console.error(`Client: Unsuccessful or malformed response from proxy for chunk ${i + 1}`, result);
                    throw new Error(result.error || `Proxy returned unsuccessful status for chunk ${i + 1}`);
                }

                // Add extracted terms from this chunk to the main list
                allKeyTerms.push(...result.data.keyTerms.filter(term => term && term.term)); // Filter invalid terms
                console.log(`Client: Received ${result.data.keyTerms.length} terms from chunk ${i + 1}. Total terms: ${allKeyTerms.length}`);

            } catch (chunkError) {
                console.error(`Client: Failed to process chunk ${i + 1}:`, chunkError);
                overallSuccess = false;
                if (!firstError) {
                    firstError = chunkError instanceof Error ? chunkError.message : String(chunkError);
                }
                // Optionally add an error placeholder term
                allKeyTerms.push({ term: `Chunk ${i + 1} Error`, meaning: chunkError instanceof Error ? chunkError.message : String(chunkError), category: "Processing Error" });
                // Continue with next chunk despite the error
            }

            // 3. Report progress
            if (onProgress) {
                onProgress(i + 1, totalChunks);
            }
            
            // Add a delay between requests to avoid rate limiting and reduce server load
            if (i < totalChunks - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
        }

        // 4. Combine results and deduplicate
        const termMap = new Map<string, KeyTerm>();
        allKeyTerms.forEach(term => {
            if (term && term.term && term.category !== "Processing Error") { // Don't deduplicate error placeholders
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
        const finalKeyTerms = Array.from(termMap.values());
        // Add back any error placeholders
        finalKeyTerms.push(...allKeyTerms.filter(term => term.category === "Processing Error"));

        console.log(`Client: Finished processing all chunks. Final term count: ${finalKeyTerms.length}`);

        // 5. Return final combined response
        return {
            success: overallSuccess,
            data: {
                title: "Document Analysis", // Generic title
                extractionMode: mode,
                keyTerms: finalKeyTerms,
            },
            error: firstError || undefined, // Report the first error encountered
        };

    } catch (error: unknown) {
        console.error("[Client Orchestration] Critical error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false,
            error: `Client-side orchestration failed: ${errorMessage}`,
        };
    }
};
