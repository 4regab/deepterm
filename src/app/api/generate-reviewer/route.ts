import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage, refundAIGeneration } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount, Type } from "@/services/geminiClient";
import { verifyTurnstileToken } from "@/services/turnstile";
import {
  MAX_GENERATE_TEXT_LENGTH,
  MAX_REVIEWER_FILE_SIZE,
  extractDocxText,
  isDocxMime,
  isGeminiUploadMime,
  resolveGenerateMimeType,
} from "@/utils/generateInput";
import { GeminiReviewerResponseSchema } from "@/lib/schemas/geminiOutput";
import { combineAbortSignals, GENERATION_TIMEOUT_MS, isAbortError, throwIfAborted } from "@/utils/abort";
import { forbiddenUnlessSameOrigin } from "@/lib/auth/assertSameOrigin";

const MAX_FILE_SIZE = MAX_REVIEWER_FILE_SIZE;
const MAX_TEXT_LENGTH = MAX_GENERATE_TEXT_LENGTH;
const VALID_EXTRACTION_MODES = ["full", "sentence", "keywords"] as const;

const reviewerResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The title of the document or study material",
    },
    extractionMode: {
      type: Type.STRING,
      description: "The extraction mode used: full, sentence, or keywords",
    },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The category name grouping related terms",
          },
          color: {
            type: Type.STRING,
            description: "Hex color code for the category (e.g., #E0F2FE)",
          },
          terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: {
                  type: Type.STRING,
                  description: "The key term or concept exactly as it appears in the source.",
                },
                definition: {
                  type: Type.STRING,
                  description: "The EXACT VERBATIM definition as it appears in the source document. Must be copied exactly - do not paraphrase. Must be non-empty.",
                },
                examples: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Optional examples from the source document",
                },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Optional keywords from the source document",
                },
              },
              required: ["term", "definition"],
              propertyOrdering: ["term", "definition", "examples", "keywords"],
            },
          },
        },
        required: ["name", "color", "terms"],
        propertyOrdering: ["name", "color", "terms"],
      },
    },
  },
  required: ["title", "extractionMode", "categories"],
  propertyOrdering: ["title", "extractionMode", "categories"],
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
    const textContent = formData.get("textContent") as string | null;
    const rawExtractionMode = (formData.get("extractionMode") as string) || "full";
    const extractionMode = VALID_EXTRACTION_MODES.includes(rawExtractionMode as typeof VALID_EXTRACTION_MODES[number])
      ? rawExtractionMode
      : "full";

    if (!file && !textContent) {
      return NextResponse.json({ error: "No file or text content provided" }, { status: 400 });
    }

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }, { status: 400 });
    }

    if (textContent && textContent.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({
        error: `Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters`,
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
      return NextResponse.json({ error: "Rate limit service unavailable. Please try again." }, { status: 503 });
    }

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: "Daily AI generation limit reached (10/day)",
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString(),
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

    let extractionGuidance = "";
    switch (extractionMode) {
      case "sentence":
        extractionGuidance = "For each term, extract the FIRST SENTENCE of its definition exactly as it appears in the source.";
        break;
      case "keywords":
        extractionGuidance = "For each term, extract the KEY WORDS from its definition. Format: '- keyword1, keyword2, keyword3'. EVERY term MUST have at least 3-5 keywords.";
        break;
      case "full":
      default:
        extractionGuidance = `For each term, extract the COMPLETE definition VERBATIM from the source.
For bullet point lists: combine ALL bullets into the definition with proper punctuation.
For numbered lists: include ALL items in the definition.
Include ALL details, examples, steps, and explanations from the source.`;
        break;
    }

    const systemPrompt = `You are an expert study material extractor. Your job is to extract EVERY SINGLE term and definition from the document - be EXHAUSTIVE.

${extractionGuidance}

CRITICAL: EXTRACT EVERYTHING - DO NOT BE SELECTIVE
1. Process the ENTIRE document from START to END
2. Extract EVERY term that has ANY explanation, definition, or description
3. Extract ALL headers, subheaders, concepts, algorithms, data structures, processes
4. For bullet point lists under a header, the header is the TERM and ALL bullets combined are the DEFINITION
5. Short definitions are OK - extract them anyway
6. DO NOT skip content because it seems "minor" - extract EVERYTHING

MANDATORY:
- Extract AT LEAST 100+ terms from a long document
- Every section header with content below it = 1 card minimum
- Group into logical categories by topic
- Do NOT summarize or skip - be EXHAUSTIVE

COLOR OPTIONS for categories: #E0F2FE, #DCFCE7, #FEF3C7, #FCE7F3, #E0E7FF, #F3E8FF`;

    const contents: Array<{ role: string; parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }> }> = [];

    if (fileUri && mimeType) {
      contents.push({
        role: "user",
        parts: [
          { fileData: { fileUri, mimeType } },
          { text: "Extract EVERY SINGLE term and definition from this document. Be EXHAUSTIVE - I want ALL content extracted. Include ALL headers, ALL bullet lists, ALL algorithms, ALL examples, ALL case studies. Do not skip anything. Organize into categories." },
        ],
      });
    } else if (effectiveText) {
      contents.push({
        role: "user",
        parts: [{ text: `Extract EVERY SINGLE term and definition from this text. Be EXHAUSTIVE - extract ALL content and organize into categories:\n\n${effectiveText}` }],
      });
    }

    const { text: responseText } = await generateContentWithRotation({
      model: "gemini-2.5-flash-lite",
      contents,
      preferredKeyIndex: uploadKeyIndex,
      signal,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
        responseSchema: reviewerResponseSchema,
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
      console.error("[GenerateReviewer] Failed to parse structured response:", responseText.substring(0, 500));
      await refundAIGeneration();
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
    }

    const parsed = GeminiReviewerResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      await refundAIGeneration();
      return NextResponse.json({ error: "AI returned invalid reviewer data. Please try again." }, { status: 500 });
    }

    const result = {
      ...parsed.data,
      categories: parsed.data.categories.filter((category) => category.terms.length > 0),
    };

    return NextResponse.json({
      ...result,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    if (billed) {
      await refundAIGeneration();
    }
    if (isAbortError(error)) {
      return NextResponse.json({ error: "Generation timed out or was cancelled." }, { status: 499 });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Generate reviewer error:", errorMessage);
    return NextResponse.json({ error: "Failed to generate reviewer content. Please try again." }, { status: 500 });
  }
}
