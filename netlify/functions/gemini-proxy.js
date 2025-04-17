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
        }        // Get API key from Netlify environment variables (must be set in Netlify dashboard)
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
                result = await model.generateContent(prompt);
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

        // Extract JSON from the response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: "Failed to extract JSON from the response"
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const jsonString = jsonMatch[0];

        // Validate JSON before parsing
        let extractionResult;
        try {
            extractionResult = JSON.parse(jsonString);
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: "Invalid JSON in the response"
                }),
                headers: { 'Content-Type': 'application/json' }
            };
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
