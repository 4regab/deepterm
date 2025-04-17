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
        const body = JSON.parse(event.body);
        const { prompt: text, mode = "full" } = body;

        if (!text) {
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
                topK: 40
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
            extractionGuidance = "Provide ONLY ONE SENTENCE as the definition.";
        } else if (mode === "keywords") {
            extractionGuidance = "Extract ONLY the IMPORTANT KEY WORDS as comma-separated values.";
        }

        const extractionPrompt = `
Extract key terms and their definitions from this text snippet.
${extractionGuidance}

Format as JSON object: {"keyTerms": [{"term": "TERM", "meaning": "DEFINITION", "category": "CATEGORY"}]}

Text:
${text}
`;

        console.log("Sending prompt to Gemini API");
        
        // Make API call with retry
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
        try {
            // Try to find a JSON object in the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonResult = JSON.parse(jsonMatch[0]);
                
                // Ensure keyTerms exists and is an array
                if (!jsonResult.keyTerms) {
                    jsonResult.keyTerms = [];
                } else if (!Array.isArray(jsonResult.keyTerms)) {
                    jsonResult.keyTerms = [jsonResult.keyTerms];
                }
                
                // Filter out invalid terms
                jsonResult.keyTerms = jsonResult.keyTerms.filter(term => term && term.term);
                
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, data: jsonResult }),
                    headers: { 'Content-Type': 'application/json' }
                };
            } else {
                // Create a basic JSON structure from the text
                return {
                    statusCode: 200,
                    body: JSON.stringify({ 
                        success: true, 
                        data: { 
                            keyTerms: [
                                { 
                                    term: "Text Analysis", 
                                    meaning: responseText.substring(0, 200), 
                                    category: "Generated Content" 
                                }
                            ] 
                        }
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
            }
        } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            return {
                statusCode: 200, // Still returning 200 with a fallback response
                body: JSON.stringify({ 
                    success: true, 
                    data: { 
                        keyTerms: [
                            { 
                                term: "Processing Result", 
                                meaning: responseText.substring(0, 200), 
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
