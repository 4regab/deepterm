import { GoogleGenAI } from "@google/genai";

// Load API keys from numbered environment variables
function loadApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

const API_KEYS = loadApiKeys();
const RETRY_DELAY_MS = 2000; // Delay before retrying from first key

if (API_KEYS.length === 0) {
  console.error("[GeminiClient] No API keys found. Set GEMINI_API_KEY_1 through GEMINI_API_KEY_5");
}

console.log(`[GeminiClient] Loaded ${API_KEYS.length} API key(s)`);

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("resource exhausted") ||
      message.includes("too many requests")
    );
  }
  return false;
}

export interface GeminiRequestOptions {
  model: string;
  contents: Array<{
    role: string;
    parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }>;
  }>;
  config: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export interface GeminiFileUploadOptions {
  file: Blob;
  config: { mimeType: string; displayName: string };
}

export async function generateContentWithRotation(
  options: GeminiRequestOptions
): Promise<{ text: string; keyIndex: number }> {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError: Error | null = null;

  // First pass: try all keys
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[GeminiClient] Attempting request with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const response = await ai.models.generateContent(options);
      console.log(`[GeminiClient] Success with key ${i + 1}`);
      return { text: response.text || "", keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] Key ${i + 1} failed: ${lastError.message}`);

      if (!isRateLimitError(error)) {
        // Non-rate-limit error, throw immediately
        throw lastError;
      }
      // Rate limit error, continue to next key
    }
  }

  // All keys exhausted, wait and retry from first key
  console.log(`[GeminiClient] All keys exhausted. Waiting ${RETRY_DELAY_MS}ms before retry...`);
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

  // Second pass: retry all keys once more
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[GeminiClient] Retry attempt with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const response = await ai.models.generateContent(options);
      console.log(`[GeminiClient] Retry success with key ${i + 1}`);
      return { text: response.text || "", keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] Retry key ${i + 1} failed: ${lastError.message}`);

      if (!isRateLimitError(error)) {
        throw lastError;
      }
    }
  }

  // All retries failed
  throw new Error("All API keys exhausted after retry. Please try again later.");
}

export async function createGeminiClientForFileUpload(): Promise<{
  ai: GoogleGenAI;
  keyIndex: number;
}> {
  // For file uploads, we need to return the client instance
  // Start with first key, caller should handle rotation if needed
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  return { ai: new GoogleGenAI({ apiKey: API_KEYS[0] }), keyIndex: 0 };
}

export async function uploadFileWithRotation(
  options: GeminiFileUploadOptions
): Promise<{ uploadedFile: Awaited<ReturnType<GoogleGenAI["files"]["upload"]>>; ai: GoogleGenAI; keyIndex: number }> {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError: Error | null = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      console.log(`[GeminiClient] File upload attempt with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const uploadedFile = await ai.files.upload(options);
      console.log(`[GeminiClient] File upload success with key ${i + 1}`);
      return { uploadedFile, ai, keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] File upload key ${i + 1} failed: ${lastError.message}`);

      if (!isRateLimitError(error)) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("All API keys exhausted for file upload");
}

export function getApiKeyCount(): number {
  return API_KEYS.length;
}
