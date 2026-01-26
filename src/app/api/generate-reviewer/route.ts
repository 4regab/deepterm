import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount, Type } from "@/services/geminiClient";

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - reduced for faster processing
const MAX_TEXT_LENGTH = 100000; // 100k characters

// Valid extraction modes
const VALID_EXTRACTION_MODES = ['full', 'sentence', 'keywords'] as const;

// Structured output schema for reviewer - enforces non-empty terms and definitions
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
        const textContent = formData.get("textContent") as string | null;
        const rawExtractionMode = (formData.get("extractionMode") as string) || "full";
        
        // Validate extraction mode
        const extractionMode = VALID_EXTRACTION_MODES.includes(rawExtractionMode as typeof VALID_EXTRACTION_MODES[number])
            ? rawExtractionMode
            : "full";

        if (!file && !textContent) {
            return NextResponse.json({ error: "No file or text content provided" }, { status: 400 });
        }

        // File size validation
        if (file && file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ 
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
            }, { status: 400 });
        }

        // Text length validation
        if (textContent && textContent.length > MAX_TEXT_LENGTH) {
            return NextResponse.json({ 
                error: `Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters` 
            }, { status: 400 });
        }

        let fileUri: string | null = null;
        let mimeType: string | null = null;

        // Handle file upload to Gemini Files API
        if (file) {
            mimeType = file.type || getMimeTypeFromName(file.name);
            if (!mimeType) {
                return NextResponse.json({ error: "Unsupported file type. Only PDF files are allowed." }, { status: 400 });
            }

            const arrayBuffer = await file.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: mimeType });

            const { uploadedFile, ai } = await uploadFileWithRotation({
                file: blob,
                config: { mimeType, displayName: file.name },
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

        // Build mode-specific extraction guidance
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
        } else if (textContent) {
            contents.push({
                role: "user",
                parts: [{ text: `Extract EVERY SINGLE term and definition from this text. Be EXHAUSTIVE - extract ALL content and organize into categories:\n\n${textContent}` }],
            });
        }

        const { text: responseText } = await generateContentWithRotation({
            model: "gemini-2.5-flash-lite",
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.5,
                maxOutputTokens: 65536,
                responseMimeType: "application/json",
                responseSchema: reviewerResponseSchema,
            },
        });

        // Check for empty response
        if (!responseText.trim()) {
            console.error("Empty AI response received");
            return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
        }

        // Parse the structured JSON response (guaranteed to be valid JSON matching schema)
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("[GenerateReviewer] Failed to parse structured response:", parseError);
            console.error("Raw response (first 500 chars):", responseText.substring(0, 500));
            return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
        }

        // Ensure categories array exists
        if (!result.categories) {
            result.categories = [];
        }

        // Validate and filter out terms with empty/missing definitions
        let totalFiltered = 0;
        result.categories = result.categories.map((category: { 
            name: string; 
            color: string; 
            terms: Array<{ term?: string; definition?: string; examples?: string[]; keywords?: string[] }> 
        }) => {
            const originalCount = category.terms?.length || 0;
            
            const filteredTerms = (category.terms || []).filter((item) => {
                const term = item.term?.trim();
                const definition = item.definition?.trim();
                
                // Must have both non-empty term and definition
                if (!term || !definition) {
                    console.warn(`[GenerateReviewer] Filtered out term with empty term or definition in category "${category.name}": term="${term}"`);
                    return false;
                }
                
                // Definition should have some content (at least 3 characters)
                if (definition.length < 3) {
                    console.warn(`[GenerateReviewer] Filtered out term with too short definition in category "${category.name}": term="${term}"`);
                    return false;
                }
                
                return true;
            }).map((item) => ({
                term: item.term!.trim(),
                definition: item.definition!.trim(),
                examples: item.examples || [],
                keywords: item.keywords || [],
            }));
            
            totalFiltered += originalCount - filteredTerms.length;
            
            return {
                ...category,
                terms: filteredTerms,
            };
        }).filter((category: { terms: unknown[] }) => category.terms.length > 0); // Remove empty categories

        // Log if we filtered out any terms
        if (totalFiltered > 0) {
            console.log(`[GenerateReviewer] Filtered ${totalFiltered} terms with empty/invalid definitions`);
        }

        // Usage already incremented atomically in checkAndIncrementAIUsage

        return NextResponse.json({
            ...result,
            remaining: rateLimit.remaining
        });
    } catch (error) {
        // Log full error server-side only - never expose to client
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Generate reviewer error:", errorMessage);
        
        // Return sanitized errors - no internal details exposed
        if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
            return NextResponse.json({ error: "API rate limit exceeded. Please try again later." }, { status: 429 });
        }
        if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
            return NextResponse.json({ error: "Request timed out. Please try with a smaller file." }, { status: 504 });
        }
        
        // Generic error - no details field
        return NextResponse.json({ error: "Failed to generate reviewer content. Please try again." }, { status: 500 });
    }
}

function getMimeTypeFromName(filename: string): string | null {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
        case "pdf": return "application/pdf";
        default: return null;
    }
}
