
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

class GeminiCore {
  private genAI: GoogleGenerativeAI;
  private model: string;
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = "gemini-flash-latest"; // Updated to use the latest Gemini Flash model
  }

  async generateContent(
    userPrompt: string,
    systemPrompt: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      topK?: number;
      topP?: number;
    }
  ): Promise<GenerationResult> {
    try {
      const generationConfig = {
        temperature: options?.temperature ?? 0.7,
        topK: options?.topK ?? 40,
        topP: options?.topP ?? 0.95,
        maxOutputTokens: options?.maxOutputTokens ?? 8192,
      };

      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig,
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      return {
        success: true,
        data: {
          candidates: [{
            content: {
              parts: [{ text: result.response.text() }]
            }
          }]
        }
      };
    } catch (error) {
      console.error("Error generating content:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

export default GeminiCore;
