const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Handler for Netlify serverless function - Processes ONE chunk at a time
exports.handler = async (event, context) => {
    // Log start of function execution
    console.log("Processing request");

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' }), 
            headers: { 'Content-Type': 'application/json' } 
        };
    }

    try {
        // Parse the request body
        console.log("Raw request body:", event.body);
        const body = JSON.parse(event.body);
        console.log("Parsed request body:", body);
        const { prompt: text, mode = "full" } = body;
        
        if (!text) {
            console.error("Missing prompt parameter");
            return { 
                statusCode: 400, 
                body: JSON.stringify({ success: false, error: "Missing prompt parameter" }), 
                headers: { 'Content-Type': 'application/json' } 
            };
        }

        // Log text size to help with debugging
        console.log(`Processing text chunk of length: ${text.length} with mode: ${mode}`);

        // Get API key from Netlify environment variables
        const apiKeys = [];
        for (let i = 1; i <= 10; i++) {
            const varName = `GEMINI_API_KEY_${i}`;
            const key = process.env[varName];
            if (key && key.trim() !== '') {
                apiKeys.push(key);
            }
        }

        if (apiKeys.length === 0) {
            console.error("API key configuration error: No valid API keys found");
            return { 
                statusCode: 500, 
                body: JSON.stringify({ success: false, error: "API key configuration error." }), 
                headers: { 'Content-Type': 'application/json' } 
            };
        }

        // Randomize API key selection for better load distribution
        const randomIndex = Math.floor(Math.random() * apiKeys.length);
        const apiKey = apiKeys[randomIndex];

        // Initialize the Gemini model - using Flash for speed
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Using Flash model for speed and reduced memory
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048, // Reduced for speed and memory efficiency
                topP: 0.9,
                topK: 40,
                responseMimeType: "text/plain" // Use plain text format for better reliability
            },
            safetySettings: [
                { category: LocalHarmCategory.HARM_CATEGORY_HARASSMENT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
                { category: LocalHarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: LocalHarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // Simplified prompt for extracting terms
        let extractionGuidance = "Provide the definition as it appears in the text.";
        if (mode === "sentence") {
            extractionGuidance = "Provide EXACTLY ONE SENTENCE as the definition for each term.";
        } else if (mode === "keywords") {
            extractionGuidance = "List only IMPORTANT KEY WORDS as the meaning.";
        }

        // More explicit prompt with clear instructions for JSON formatting
        const extractionPrompt = `
You are a specialized AI that extracts key terms and their definitions from text.
Your only task is to extract terms from the provided text snippet and format them as JSON.

INSTRUCTIONS:
1. Extract all important key terms, concepts, or phrases from the text.
2. ${extractionGuidance}
3. Categorize each term appropriately.
4. IMPORTANT: Always return AT LEAST 3 items, even if you have to be creative.
5. Do not include any explanations or additional text - ONLY the JSON object.

FORMAT YOUR RESPONSE AS FOLLOWS (this exact format is required):
{
  "keyTerms": [
    {
      "term": "Term 1",
      "meaning": "Definition of term 1",
      "category": "Category"
    },
    {
      "term": "Term 2",
      "meaning": "Definition of term 2",
      "category": "Category"
    },
    ...more terms
  ]
}

TEXT TO ANALYZE:
${text}
`;

        console.log("Sending prompt to Gemini API");
        
        // Make API call with no retry - let client handle retries
        let response;
        try {
            response = await model.generateContent(extractionPrompt);
        } catch (apiError) {
            console.error("Gemini API Error:", apiError);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    success: false, 
                    error: `Gemini API error: ${apiError.message}` 
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const responseText = response.response.text();
        console.log(`Response received. Length: ${responseText.length}`);
        
        // Process JSON response
        let parsedResponse;
        try {
            // --- Start Robust JSON Extraction ---
            let potentialJsonString = responseText.trim();

            // 1. Check for markdown code fences (```json ... ``` or ``` ... ```)
            const codeFenceMatch = potentialJsonString.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
            if (codeFenceMatch && codeFenceMatch[1]) {
                potentialJsonString = codeFenceMatch[1].trim();
                console.log("Extracted JSON from markdown code fence.");
            } else {
                 // 2. If no code fence, try to find the first '{' and last '}'
                 const firstBrace = potentialJsonString.indexOf('{');
                 const lastBrace = potentialJsonString.lastIndexOf('}');
                 if (firstBrace !== -1 && lastBrace > firstBrace) {
                     potentialJsonString = potentialJsonString.substring(firstBrace, lastBrace + 1);
                     console.log("Attempting to parse content between first and last braces.");
                 } else {
                     console.warn("Could not reliably identify JSON structure in response.");
                     // Keep potentialJsonString as is, parsing might still work or fail gracefully below
                 }
            }
            // --- End Robust JSON Extraction ---

            // Try to parse the extracted string
            parsedResponse = JSON.parse(potentialJsonString);

            // Ensure keyTerms exists and is an array
            if (!parsedResponse.keyTerms || !Array.isArray(parsedResponse.keyTerms)) {
                console.warn("Response missing keyTerms array or not an array, creating fallback");
                parsedResponse = { 
                    keyTerms: [
                        { 
                            term: "Text Analysis", 
                            meaning: responseText.substring(0, 200), 
                            category: "Generated Content" 
                        }
                    ] 
                };
            }

            // Ensure we have at least one valid term
            if (parsedResponse.keyTerms.length === 0) {
                console.warn("keyTerms array is empty, adding fallback term");
                parsedResponse.keyTerms.push({
                    term: "Text Content",
                    meaning: text.substring(0, 100) + "...",
                    category: "Document Content"
                });
            }

            // Validate each term has the required properties
            parsedResponse.keyTerms = parsedResponse.keyTerms
                .filter(term => term && typeof term === 'object')
                .map(term => ({
                    term: term.term || "Unnamed Term",
                    meaning: term.meaning || "No definition provided",
                    category: term.category || "Uncategorized",
                    subcategories: Array.isArray(term.subcategories) ? term.subcategories : [],
                    examples: Array.isArray(term.examples) ? term.examples : []
                }));

            console.log(`Successfully extracted ${parsedResponse.keyTerms.length} terms`);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    data: parsedResponse
                }),
                headers: { 'Content-Type': 'application/json' }
            };

        } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            console.error("Response text that failed parsing:", responseText); // Log original response
            console.error("String attempted for parsing:", potentialJsonString); // Log the string we tried to parse

            // Return a fallback response with guaranteed structure
            return {
                statusCode: 200, // Still return 200 with fallback content
                body: JSON.stringify({
                    success: true, // Indicate success=true but provide fallback
                    isFallback: true, // Add a flag to indicate fallback data
                    data: {
                        keyTerms: [
                            {
                                term: "Content Overview",
                                meaning: text.substring(0, 100) + "...",
                                category: "Document Content"
                            },
                            {
                                term: "Processing Result",
                                meaning: responseText.substring(0, 200), // Show raw response snippet
                                category: "Raw Output"
                            }
                        ]
                    }
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

    } catch (error) {
        console.error("Error processing request:", error);
        
        // Even in case of critical errors, return some valid structure
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message || "An unknown error occurred",
                data: {
                    keyTerms: [
                        {
                            term: "Error Processing",
                            meaning: "The system encountered an error while processing your text: " + 
                                    (error.message || "Unknown error"),
                            category: "System Error"
                        }
                    ]
                }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
