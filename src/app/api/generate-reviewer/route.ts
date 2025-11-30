import { NextRequest, NextResponse } from "next/server";
import { FileState } from "@google/genai";
import { checkAndIncrementAIUsage } from "@/services/rateLimit";
import { generateContentWithRotation, uploadFileWithRotation, getApiKeyCount } from "@/services/geminiClient";

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB - reduced for faster processing
const MAX_TEXT_LENGTH = 100000; // 100k characters

// Valid extraction modes
const VALID_EXTRACTION_MODES = ['full', 'sentence', 'keywords'] as const;

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
                extractionGuidance = "For each term, provide ONLY ONE SENTENCE as the definition or explanation. Keep it brief and concise.";
                break;
            case "keywords":
                extractionGuidance = "For each term, extract ONLY the IMPORTANT KEY WORDS related to it. Start with a dash (-) and then list the keywords separated by commas. Do not include full sentences. Format example: '- keyword1, keyword2, keyword3'. IMPORTANT: EVERY term MUST have at least 3-5 keywords.";
                break;
            case "full":
            default:
                extractionGuidance = `For each term, provide the EXACT definition or explanation as it appears in the original text. Include examples if found.

CRITICAL RULE FOR LISTS AND BULLET POINTS:
When you encounter a section header followed by a list of items (like "Advantages", "Disadvantages", "Types of X", "Characteristics of X", "Operations", etc.):
- The section header becomes the TERM (e.g., "Advantages of Linked List", "Types of Stack Operations")
- ALL the bullet points/list items under it become the DEFINITION as a combined text
- DO NOT create separate terms for each list item
- Format the definition by joining all items with proper punctuation

STANDALONE CONCEPTS:
Concepts with their own full definitions (like "Singly Linked List", "Stack", "Array", "Queue") should remain as separate individual terms with their complete definitions.`;
                break;
        }

        const systemPrompt = `You are an expert study material extractor. Extract EVERY term and definition from the document, then organize them into categories.

${extractionGuidance}

EXTRACTION RULES:
1. Extract EVERY term that has a definition
2. Extract ALL technical vocabulary, concepts, names, formulas
3. Group into logical categories
4. Terms and definitions should be VERBATIM from source

OUTPUT FORMAT - Valid JSON:
{
  "title": "Document title",
  "extractionMode": "${extractionMode}",
  "categories": [
    {
      "name": "Category Name",
      "color": "#E0F2FE",
      "terms": [{"term": "Term", "definition": "Definition", "examples": [], "keywords": []}]
    }
  ]
}

COLOR OPTIONS: #E0F2FE, #DCFCE7, #FEF3C7, #FCE7F3, #E0E7FF, #F3E8FF`;

        const contents: Array<{ role: string; parts: Array<{ text?: string; fileData?: { fileUri: string; mimeType: string } }> }> = [];

        if (fileUri && mimeType) {
            contents.push({
                role: "user",
                parts: [
                    { fileData: { fileUri, mimeType } },
                    { text: "Extract and categorize ALL key terms and definitions from this ENTIRE document, paying special attention to the END sections. Return ONLY a JSON object." },
                ],
            });
        } else if (textContent) {
            contents.push({
                role: "user",
                parts: [{ text: `Extract and categorize ALL key terms and definitions from this ENTIRE text, paying special attention to the END sections:\n\n${textContent}\n\nReturn ONLY a JSON object.` }],
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
            },
        });

        // Check for empty response
        if (!responseText.trim()) {
            console.error("Empty AI response received");
            return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
        }

        // Parse JSON from response with error recovery
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Initial JSON parse failed:", parseError);
            console.error("Raw response length:", responseText.length);
            console.error("Raw response (first 1000 chars):", responseText.substring(0, 1000));
            
            // Try to extract JSON object
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON object found in response");
                return NextResponse.json({ 
                    error: "AI response was not in expected format. Please try again.",
                }, { status: 500 });
            }
            
            // Attempt to fix common JSON issues
            let fixedJson = jsonMatch[0]
                .replace(/,\s*}/g, '}')  // Remove trailing commas before }
                .replace(/,\s*]/g, ']'); // Remove trailing commas before ]
            
            try {
                result = JSON.parse(fixedJson);
            } catch {
                // Try more aggressive fixing - handle unescaped characters in string values
                try {
                    // Remove control characters except valid JSON whitespace
                    fixedJson = fixedJson.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
                    result = JSON.parse(fixedJson);
                } catch (finalError) {
                    console.error("All JSON parse attempts failed:", finalError);
                    console.error("Attempted to parse:", fixedJson.substring(0, 500));
                    return NextResponse.json({ 
                        error: "Failed to parse AI response. Please try again with different content.",
                    }, { status: 500 });
                }
            }
        }

        // Ensure categories array exists
        if (!result.categories) {
            result.categories = [];
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
