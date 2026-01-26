import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount, Type } from "@/services/geminiClient";
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

// Structured output schema for flashcards - enforces non-empty term and definition
const flashcardResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      term: {
        type: Type.STRING,
        description: "The key term, concept, or vocabulary word exactly as it appears in the source.",
      },
      definition: {
        type: Type.STRING,
        description: "The EXACT VERBATIM definition as it appears in the source document. Must be copied exactly - do not paraphrase or rewrite. Must be non-empty.",
      },
    },
    required: ["term", "definition"],
    propertyOrdering: ["term", "definition"],
  },
};

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
    const systemPrompt = `You are an expert study material extractor. Your job is to extract EVERY SINGLE term and definition from the document - be EXHAUSTIVE.

CRITICAL: EXTRACT EVERYTHING - DO NOT BE SELECTIVE
1. Process the ENTIRE document from START to END
2. Extract EVERY term that has ANY explanation, definition, or description
3. Extract ALL headers, subheaders, concepts, algorithms, data structures, processes, etc.
4. For bullet point lists under a header, the header is the TERM and ALL bullets combined are the DEFINITION
5. For numbered lists, same rule - header is TERM, all items are DEFINITION
6. Short definitions are OK - extract them anyway
7. DO NOT skip content because it seems "minor" - extract EVERYTHING

WHAT TO EXTRACT:
- Main concepts with their definitions
- Headers followed by explanatory text
- Headers followed by bullet points (combine bullets into definition)
- Algorithms and their descriptions
- Data structures and their descriptions  
- Processes and their steps
- Types/categories and their explanations
- Advantages/disadvantages lists
- Applications and examples
- Case studies and their solutions
- ANY term that has text explaining what it is

DEFINITION FORMAT:
- Copy the definition VERBATIM from the source
- For bullet lists: combine all bullets with proper punctuation
- Include ALL details, examples, and explanations from the source
- Short definitions are acceptable - do not skip them

MANDATORY:
- Extract AT LEAST 100+ terms from a long document
- Every section header with content below it = 1 card minimum
- Do NOT summarize or skip - be EXHAUSTIVE`;

    const contents: Array<{ role: string; parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }> }> = [];

    if (fileUri && mimeType) {
      contents.push({
        role: "user",
        parts: [
          { fileData: { fileUri, mimeType } },
          { text: "Extract EVERY SINGLE term and definition from this document. Be EXHAUSTIVE - I want ALL content extracted, not just the main concepts. Include ALL headers with their explanations, ALL bullet point lists, ALL algorithms, ALL examples. Do not skip anything." },
        ],
      });
    } else if (textContent) {
      contents.push({
        role: "user",
        parts: [{ text: `Extract EVERY SINGLE term and definition from this text. Be EXHAUSTIVE - extract ALL content:\n\n${textContent}` }],
      });
    }

    const { text: responseText } = await generateContentWithRotation({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
        responseSchema: flashcardResponseSchema,
      },
    });

    // Parse the structured JSON response (guaranteed to be valid JSON matching schema)
    let rawCards;
    try {
      rawCards = JSON.parse(responseText);
    } catch {
      console.error("[GenerateCards] Failed to parse structured response:", responseText.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Validate and filter out cards with empty/missing definitions
    const cards = rawCards.filter((card: { term?: string; definition?: string }) => {
      const term = card.term?.trim();
      const definition = card.definition?.trim();
      
      // Must have both non-empty term and definition
      if (!term || !definition) {
        console.warn(`[GenerateCards] Filtered out card with empty term or definition: term="${term}"`);
        return false;
      }
      
      // Definition should have some content (at least 3 characters)
      if (definition.length < 3) {
        console.warn(`[GenerateCards] Filtered out card with too short definition: term="${term}", def="${definition}"`);
        return false;
      }
      
      return true;
    }).map((card: { term: string; definition: string }) => ({
      term: card.term.trim(),
      definition: card.definition.trim(),
    }));

    // Log if we filtered out any cards
    if (rawCards.length !== cards.length) {
      console.log(`[GenerateCards] Filtered ${rawCards.length - cards.length} cards with empty definitions. Remaining: ${cards.length}`);
    }

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
