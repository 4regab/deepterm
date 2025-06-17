/**
 * File processing utility using Gemini Files API
 * This replaces the complex local extraction logic in fileUtils.ts
 */

import { 
  uploadFileToGemini, 
  extractKeyTermsFromFile, 
  deleteFileFromGemini,
  checkApiKey 
} from '@/services/geminiService';
import { ExtractionMode, ExtractionResult } from '@/types';

export interface FileProcessingResult {
  success: boolean;
  text?: string;
  extractionResult?: ExtractionResult;
  error?: string;
  fileId?: string;
}

/**
 * Supported file types for Gemini Files API
 */
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc']
};

/**
 * Check if a file type is supported by the Files API
 */
export const isFileTypeSupported = (file: File): boolean => {
  const fileType = file.type;
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  return Object.entries(SUPPORTED_FILE_TYPES).some(([mimeType, extensions]) => 
    fileType === mimeType || extensions.includes(fileExtension)
  );
};

/**
 * Process a file using Gemini Files API for text extraction
 * This is the main function that replaces the complex local extraction logic
 */
export const processFileWithGemini = async (
  file: File,
  mode: ExtractionMode = "full"
): Promise<FileProcessingResult> => {
  if (!checkApiKey()) {
    return {
      success: false,
      error: "API key not configured. Please set your Gemini API key first."
    };
  }

  try {
    // Validate file type
    if (!isFileTypeSupported(file)) {
      return {
        success: false,
        error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, DOC, TXT`
      };
    }

    // Validate file size (Gemini Files API has limits)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum limit of 50MB`
      };
    }

    console.log(`Processing file with Gemini Files API: ${file.name} (${file.size} bytes)`);    // Step 1: Upload file to Gemini Files API
    const fileInfo = await uploadFileToGemini(file);
    console.log(`File uploaded successfully with ID: ${fileInfo.name}, URI: ${fileInfo.uri}`);

    try {
      // Step 2: Extract content using the Files API
      const extractionResult = await extractKeyTermsFromFile(fileInfo, mode);
      
      // Step 3: Clean up the uploaded file
      await deleteFileFromGemini(fileInfo.name);
      console.log(`File ${fileInfo.name} cleaned up successfully`);

      // For backward compatibility, also provide extracted text
      const extractedText = extractionResult.keyTerms
        .map(term => `${term.term}: ${term.meaning}`)
        .join('\n\n');

      return {
        success: true,
        text: extractedText,
        extractionResult,
        fileId: fileInfo.name
      };    } catch (processingError) {
      // If processing fails, still try to clean up the uploaded file
      try {
        await deleteFileFromGemini(fileInfo.name);
        console.log(`File ${fileInfo.name} cleaned up after processing error`);
      } catch (cleanupError) {
        console.warn(`Failed to clean up file ${fileInfo.name}:`, cleanupError);
      }
      throw processingError;
    }

  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during file processing'
    };
  }
};

/**
 * Process a file for quiz generation (simplified workflow)
 */
export const processFileForQuiz = async (file: File): Promise<FileProcessingResult> => {
  return processFileWithGemini(file, "full");
};

/**
 * Process a file for flashcard generation (simplified workflow)
 */
export const processFileForFlashcards = async (file: File): Promise<FileProcessingResult> => {
  return processFileWithGemini(file, "full");
};

/**
 * Simple text processing for manual input (no file upload needed)
 */
export const processTextContent = (text: string): FileProcessingResult => {
  if (!text.trim()) {
    return {
      success: false,
      error: "No text content provided"
    };
  }

  // For manual text input, we just return the text as-is
  // The actual processing will be done by the quiz/flashcard generators
  return {
    success: true,
    text: text.trim()
  };
};

/**
 * Get file size limit information for display to users
 */
export const getFileLimits = () => ({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxSizeFormatted: "50MB",
  supportedTypes: ["PDF", "DOCX", "DOC", "TXT"]
});

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
