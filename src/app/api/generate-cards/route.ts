import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount } from "@/services/geminiClient";
import { z } from "zod";

// File size limits (in bytes)
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 100000; // 100k characters

// Zod schema for input validation
const GenerateCardsInputSchema = z.object({
  textContent: z.string().max(MAX_TEXT_LENGTH, `Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters`).optional().nullable(),
});

// Allowed MIME types whitelist
const ALLOWED_MIME_TYPES = ["application/pdf"] as const;

export async function POST(request: NextRequest) {
  if (getApiKeyCount() === 0) {
    return NextResponse.json({ error: "No Gemini API keys configured" }, { status: 500 });
  }

  // Atomic rate limit check and increment
  const rateLimit = await checkAndIncrementAIUsage();
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: "Daily AI generation limit reached (10/day)",
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt.toISOString()
    }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawTextContent = formData.get("textContent");

    // Validate text content with Zod
    const validatedInput = GenerateCardsInputSchema.safeParse({
      textContent: typeof rawTextContent === "string" ? rawTextContent : null,
    });

    if (!validatedInput.success) {
      return NextResponse.json({
        error: "Invalid input",
        details: validatedInput.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const textContent = validatedInput.data.textContent;

    if (!file && !textContent) {
      return NextResponse.json({ error: "No file or text content provided" }, { status: 400 });
    }

    // File size validation
    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // MIME type validation against whitelist
    if (file) {
      const mimeType = file.type || getMimeTypeFromName(file.name);
      if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
        return NextResponse.json({ error: "Unsupported file type. Only PDF files are allowed." }, { status: 400 });
      }
    }

    let fileUri: string | null = null;
    let mimeType: string | null = null;

    // Handle file upload to Gemini Files API
    if (file) {
      mimeType = file.type || getMimeTypeFromName(file.name);
      // MIME type already validated above, safe to assert non-null
      const validMimeType = mimeType!;

      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: validMimeType });

      const { uploadedFile, ai } = await uploadFileWithRotation({
        file: blob,
        config: { mimeType: validMimeType, displayName: file.name },
      });

      // Wait for file processing
      let geminiFile = await ai.files.get({ name: uploadedFile.name! });
      while (geminiFile.state === FileState.PROCESSING) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        geminiFile = await ai.files.get({ name: uploadedFile.name! });
      }

      if (geminiFile.state === FileState.FAILED) {
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }

      fileUri = geminiFile.uri!;
    }

    // Build prompt for card generation
    const systemPrompt = `You are an expert study material creator. Extract ALL key terms and their definitions from the provided content.

CRITICAL INSTRUCTION: You MUST process the ENTIRE text from beginning to END without skipping ANY content.
Output ONLY a valid JSON array of objects with "term" and "definition" fields.
1. ONLY Extract EVERY key term with DEFINITION that appears in the text (including  subterms, technical terms, examples with meaning, important concepts, and defined phrases)
2. Do NOT limit yourself to a small number - capture ALL educational terms and definition content
3. Terms and definition should be VERBATIM from document/study material
4. Do NOT include any other content in the JSON array.
5. MANDATORY: Ensure that all sections until the end are ALWAYS extracted completely
6. MANDATORY:The output format should be a valid JSON array of objects with "term" and "definition" fields.
7. Term and Definition must be always verbatim.

Example output format:
[
  {"term": "Photosynthesis", "definition": "The process by which plants convert sunlight into energy"},
  {"term": "Chlorophyll", "definition": "Green pigment in plants that absorbs light for photosynthesis. Example:  "}
]`;

    const contents: Array<{ role: string; parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }> }> = [];

    if (fileUri && mimeType) {
      contents.push({
        role: "user",
        parts: [
          { fileData: { fileUri, mimeType } },
          { text: "Extract key terms and definitions from this document. Return ONLY a JSON array." },
        ],
      });
    } else if (textContent) {
      contents.push({
        role: "user",
        parts: [{ text: `Extract key terms and definitions from this text:\n\n${textContent}\n\nReturn ONLY a JSON array.` }],
      });
    }

    const { text: responseText } = await generateContentWithRotation({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 50000,
      },
    });

    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const cards = JSON.parse(jsonMatch[0]);

    // Usage already incremented atomically in checkAndIncrementAIUsage

    return NextResponse.json({
      cards,
      remaining: rateLimit.remaining
    });
  } catch (error) {
    // Log full error server-side only
    console.error("Generate cards error:", error instanceof Error ? error.message : String(error));
    
    // Return sanitized error to client - no internal details
    return NextResponse.json({ error: "Failed to generate cards. Please try again." }, { status: 500 });
  }
}

function getMimeTypeFromName(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf": return "application/pdf";
    default: return null;
  }
}
