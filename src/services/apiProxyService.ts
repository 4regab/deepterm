/**
 * API Proxy Service for DeepTerm
 * 
 * This service handles secure API requests without exposing API keys in client-side code.
 * It uses a server-side proxy approach to protect sensitive credentials.
 */

// Types for the proxy service
type ProxyRequestOptions = {
    prompt: string;
    mode?: string;
    maxRetries?: number;
};

type ProxyRequestConfig = {
    method: string;
    headers: Record<string, string>;
    body?: string;
};

// Export the ProxyResponse type
export type ProxyResponse = {
    success: boolean;
    data?: any;
    error?: string;
};

/**
 * Send a secure request to the Gemini API through a server-side proxy
 * @param options - The request options including prompt and extraction mode
 * @returns Promise with the extraction result
 */
export const sendSecureGeminiRequest = async (options: ProxyRequestOptions): Promise<ProxyResponse> => {
    try {
        // Prepare request configuration
        const config: ProxyRequestConfig = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: options.prompt,
                mode: options.mode || 'full',
                maxRetries: options.maxRetries || 3,
            }),
        };    // In development mode, we'll use the client-side approach temporarily
        // In production, we use the Netlify function
        if (import.meta.env.DEV) {
            return await developmentFallback(options);
        }

        // Make the call to our Netlify serverless function
        const response = await fetch('/.netlify/functions/gemini-proxy', config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        console.error("[Secure API Proxy] Request failed:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Development-only fallback that simulates the proxy response
 * This should be removed in production and replaced with actual server-side proxy
 * @param options - The request options
 * @returns Promise simulating a proxy response
 */
const developmentFallback = async (options: ProxyRequestOptions): Promise<ProxyResponse> => {
    console.warn('[Secure API Proxy] Using development fallback - NO ACTUAL PROXY IN PLACE');
    console.warn('[Secure API Proxy] In production, API keys should be handled server-side only');

    // Import the actual implementation only in development mode
    // This is a temporary fallback and should be removed in production
    try {
        const { extractKeyTerms } = await import('./geminiService');
        const result = await extractKeyTerms(options.prompt, options.mode as any);
        return {
            success: true,
            data: result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Instructions for implementing the server-side proxy:
/*
IMPORTANT: For complete security, you need to implement a server-side proxy that:
1. Receives requests from the client
2. Adds the API key from secure server-side environment variables
3. Makes the request to the Gemini API
4. Returns only the necessary response data to the client

Example server implementation (Node.js/Express):

```javascript
// Server-side code (not to be included in client)
const express = require('express');
const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.use(express.json());

app.post('/api/gemini-proxy', async (req, res) => {
  try {
    const { prompt, mode } = req.body;
    
    // API key securely stored in server environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25",
      // Additional configuration...
    });
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Process and return the result to the client
    res.json({ result: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```
*/
