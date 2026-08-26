import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { rotationOrder } from "@/utils/geminiRotation";
import { raceAbort, throwIfAborted } from "@/utils/abort";

// Re-export Type for use in API routes
export { Type };
export type { Schema };

/** Loads GEMINI_API_KEY plus GEMINI_API_KEY_1…5, skipping duplicates. */
export function loadApiKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | undefined) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    keys.push(value);
  };
  add(env.GEMINI_API_KEY);
  for (let i = 1; i <= 5; i++) {
    add(env[`GEMINI_API_KEY_${i}`]);
  }
  return keys;
}

const API_KEYS = loadApiKeys();
const RETRY_DELAY_MS = 2000; // Delay before retrying from first key

if (API_KEYS.length === 0) {
  console.error("[GeminiClient] No API keys found. Set GEMINI_API_KEY_1 through GEMINI_API_KEY_5");
}

console.log(`[GeminiClient] Loaded ${API_KEYS.length} API key(s)`);

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRateLimitError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("resource_exhausted") ||
    message.includes("too many requests")
  );
}

/** Continue the key ring for quota and dead keys; fail fast on prompt/model errors. */
export function isRotatableKeyError(error: unknown): boolean {
  if (isRateLimitError(error)) return true;
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("api key not valid") ||
    message.includes("api_key_invalid") ||
    message.includes("invalid api key")
  );
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
    responseSchema?: Schema;
  };
  preferredKeyIndex?: number;
  signal?: AbortSignal;
}

export interface GeminiFileUploadOptions {
  file: Blob;
  config: { mimeType: string; displayName: string };
  signal?: AbortSignal;
}

export async function generateContentWithRotation(
  options: GeminiRequestOptions
): Promise<{ text: string; keyIndex: number }> {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError: Error | null = null;
  const { preferredKeyIndex, signal, ...generateOptions } = options;
  const keyOrder = rotationOrder(API_KEYS.length, preferredKeyIndex ?? 0);

  // First pass: try all keys, starting at the preferred index so file
  // uploads and generation share the same Gemini API key.
  for (const i of keyOrder) {
    try {
      throwIfAborted(signal);
      console.log(`[GeminiClient] Attempting request with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const response = await raceAbort(ai.models.generateContent(generateOptions), signal);
      console.log(`[GeminiClient] Success with key ${i + 1}`);
      return { text: response.text || "", keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] Key ${i + 1} failed: ${lastError.message}`);

      if (!isRotatableKeyError(error)) {
        throw lastError;
      }
    }
  }

  // All keys exhausted, wait and retry from the preferred key
  console.log(`[GeminiClient] All keys exhausted. Waiting ${RETRY_DELAY_MS}ms before retry...`);
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

  // Second pass: retry all keys once more
  for (const i of keyOrder) {
    try {
      throwIfAborted(signal);
      console.log(`[GeminiClient] Retry attempt with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const response = await raceAbort(ai.models.generateContent(generateOptions), signal);
      console.log(`[GeminiClient] Retry success with key ${i + 1}`);
      return { text: response.text || "", keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] Retry key ${i + 1} failed: ${lastError.message}`);

      if (!isRotatableKeyError(error)) {
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
  const { signal, ...uploadOptions } = options;

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      throwIfAborted(signal);
      console.log(`[GeminiClient] File upload attempt with key ${i + 1}/${API_KEYS.length}`);
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      const uploadedFile = await raceAbort(ai.files.upload(uploadOptions), signal);
      console.log(`[GeminiClient] File upload success with key ${i + 1}`);
      return { uploadedFile, ai, keyIndex: i };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[GeminiClient] File upload key ${i + 1} failed: ${lastError.message}`);

      if (!isRotatableKeyError(error)) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("All API keys exhausted for file upload");
}

export function getApiKeyCount(): number {
  return API_KEYS.length;
}

