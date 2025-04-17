const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

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
        const { prompt, mode = "full", maxRetries = 3 } = body;

        if (!prompt) {
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
            model: "gemini-2.0-flash-lite",
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 100000,
                topP: 0.99,
                topK: 100,
            },
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

        // Process the prompt with retry logic
        let result = null;
        let error = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}: Sending prompt to Gemini API`);
                result = await model.generateContent(prompt);
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
        extractionResult.extractionMode = mode;

        // Post-process and deduplicate results
        if (extractionResult.keyTerms && Array.isArray(extractionResult.keyTerms)) {
            const termMap = new Map();

            extractionResult.keyTerms.forEach(term => {
                const normalizedTerm = term.term.toLowerCase().trim();

                // Clean up the term's data
                if (term.examples && Array.isArray(term.examples)) {
                    term.examples = [...new Set(
                        term.examples
                            .map(example => example.replace(/^[\s•\-–—*]+/, '').trim())
                            .filter(ex => ex && ex.length > 0)
                    )];
                }

                if (term.subcategories && Array.isArray(term.subcategories)) {
                    term.subcategories = [...new Set(
                        term.subcategories
                            .map(sub => sub.replace(/^[\s•\-–—*\d]+[.)]+\s*/, '').trim())
                            .filter(sub => sub && sub.length > 0)
                    )];
                }

                if (!termMap.has(normalizedTerm)) {
                    termMap.set(normalizedTerm, term);
                }
            });

            extractionResult.keyTerms = Array.from(termMap.values());
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
