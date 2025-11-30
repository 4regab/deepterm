import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const genAI = new GoogleGenAI({ apiKey });

export const SUPPORTED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
};

export function getMimeType(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    default:
      return null;
  }
}
