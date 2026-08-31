import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage, refundAIGeneration } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount, Type } from "@/services/geminiClient";
import { verifyTurnstileToken } from "@/services/turnstile";
import {
  MAX_CARDS_FILE_SIZE,
  MAX_GENERATE_TEXT_LENGTH,
  extractDocxText,
  isDocxMime,
  isGeminiUploadMime,
  resolveGenerateMimeType,
} from "@/utils/generateInput";
import { GeminiCardsResponseSchema } from "@/lib/schemas/geminiOutput";
import {
  combineAbortSignals,
  GENERATION_MAX_DURATION_SECONDS,
  GENERATION_TIMEOUT_MS,
  isAbortError,
  throwIfAborted,
} from "@/utils/abort";
import { z } from "zod";
import { forbiddenUnlessSameOrigin } from "@/lib/auth/assertSameOrigin";

export const maxDuration = GENERATION_MAX_DURATION_SECONDS;

const MAX_FILE_SIZE = MAX_CARDS_FILE_SIZE;
const MAX_TEXT_LENGTH = MAX_GENERATE_TEXT_LENGTH;

const GenerateCardsInputSchema = z.object({
  textContent: z.string().max(MAX_TEXT_LENGTH, `Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters`).optional().nullable(),
});

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
  const csrf = forbiddenUnlessSameOrigin(request);
  if (csrf) return csrf;

  if (getApiKeyCount() === 0) {
    return NextResponse.json({ error: "No Gemini API keys configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const captcha = await verifyTurnstileToken(formData.get("cf-turnstile-response"), request);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: captcha.status });
  }

  let billed = false;
  try {
    const file = formData.get("file") as File | null;
    const rawTextContent = formData.get("textContent");

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

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    const resolvedMimeType = file ? resolveGenerateMimeType(file) : null;
    if (file && !resolvedMimeType) {
      return NextResponse.json({ error: "Unsupported file type. Upload a PDF, DOCX, PNG, JPEG, or WebP file." }, { status: 400 });
    }

    const rateLimit = await checkAndIncrementAIUsage();

    if (!rateLimit.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (rateLimit.unavailable) {
      return NextResponse.json({
        error: "Rate limit service unavailable. Please try again."
      }, { status: 503 });
    }

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: "Daily AI generation limit reached (10/day)",
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString()
      }, { status: 429 });
    }

    billed = true;

    const timeout = AbortSignal.timeout(GENERATION_TIMEOUT_MS);
    const signal = combineAbortSignals(request.signal, timeout);
    throwIfAborted(signal);

    let effectiveText = textContent;
    let fileUri: string | null = null;
    let mimeType: string | null = null;
    let uploadKeyIndex = 0;

    if (file && isDocxMime(resolvedMimeType!)) {
      const arrayBuffer = await file.arrayBuffer();
      throwIfAborted(signal);
      const extracted = await extractDocxText(arrayBuffer);
      if (!extracted) {
        await refundAIGeneration();
        return NextResponse.json({ error: "Could not read that DOCX file." }, { status: 400 });
      }
      effectiveText = extracted.slice(0, MAX_TEXT_LENGTH);
    } else if (file && isGeminiUploadMime(resolvedMimeType!)) {
      const validMimeType = resolvedMimeType!;
      mimeType = validMimeType;

      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: validMimeType });

      const { uploadedFile, ai, keyIndex } = await uploadFileWithRotation({
        file: blob,
        config: { mimeType: validMimeType, displayName: file.name },
        signal,
      });
      uploadKeyIndex = keyIndex;

      let geminiFile = await ai.files.get({ name: uploadedFile.name! });
      while (geminiFile.state === FileState.PROCESSING) {
        throwIfAborted(signal);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        geminiFile = await ai.files.get({ name: uploadedFile.name! });
      }

      if (geminiFile.state === FileState.FAILED) {
        await refundAIGeneration();
        return NextResponse.json({ error: "File processing failed" }, { status: 500 });
      }

      fileUri = geminiFile.uri!;
    }

    if (!fileUri && !effectiveText) {
      await refundAIGeneration();
      return NextResponse.json({ error: "No file or text content provided" }, { status: 400 });
    }

    const systemPrompt = `You are an expert study material extractor. Your job is to extract EVERY SINGLE term and definition from the document - be EXHAUSTIVE.

CRITICAL: EXTRACT EVERYTHING - DO NOT BE SELECTIVE
1. Process the ENTIRE document from START to END
2. Extract EVERY term that has ANY explanation, definition, or description
3. Extract ALL headers, subheaders, concepts, algorithms, data structures, processes, etc.
4. For bullet point lists under a header, the header is the TERM and ALL bullets combined are the DEFINITION
5. For numbered lists, same rule - header is TERM, all items are DEFINITION
6. Short definitions are OK - extract them anyway
7. DO NOT skip content because it seems "minor" - extract EVERYTHING

DEFINITION FORMAT:
- Copy the definition VERBATIM from the source
- For bullet lists: combine all bullets with proper punctuation
- Include ALL details, examples, and explanations from the source

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
    } else if (effectiveText) {
      contents.push({
        role: "user",
        parts: [{ text: `Extract EVERY SINGLE term and definition from this text. Be EXHAUSTIVE - extract ALL content:\n\n${effectiveText}` }],
      });
    }

    const { text: responseText } = await generateContentWithRotation({
      model: "gemini-2.5-flash-lite",
      contents,
      preferredKeyIndex: uploadKeyIndex,
      signal,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
        responseSchema: flashcardResponseSchema,
      },
    });

    if (!responseText.trim()) {
      await refundAIGeneration();
      return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(responseText);
    } catch {
      console.error("[GenerateCards] Failed to parse structured response:", responseText.substring(0, 500));
      await refundAIGeneration();
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const parsedCards = GeminiCardsResponseSchema.safeParse(parsedJson);
    if (!parsedCards.success) {
      await refundAIGeneration();
      return NextResponse.json({ error: "AI returned invalid flashcard data. Please try again." }, { status: 500 });
    }

    const cards = parsedCards.data.map((card) => ({
      term: card.term,
      definition: card.definition,
    }));

    return NextResponse.json({
      cards,
      remaining: rateLimit.remaining
    });
  } catch (error) {
    if (billed) {
      await refundAIGeneration();
    }
    if (isAbortError(error)) {
      return NextResponse.json({ error: "Generation timed out or was cancelled." }, { status: 499 });
    }
    console.error("Generate cards error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to generate cards. Please try again." }, { status: 500 });
  }
}
