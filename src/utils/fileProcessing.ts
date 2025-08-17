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
 * Restricted to PDF only for maximum reliability
 */
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': ['.pdf']
};

/**
 * Check if a file type is supported by the Files API
 * Now only accepts PDF files for reliable processing
 */
export const isFileTypeSupported = (file: File): boolean => {
  const fileType = file.type;
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  console.log(`[File Type Check] Checking PDF file support:`, {
    fileName: file.name,
    detectedMimeType: fileType,
    detectedExtension: fileExtension
  });
  
  // Only allow PDF files
  const isPdf = fileType === 'application/pdf' || fileExtension === '.pdf';
  
  console.log(`[File Type Check] PDF validation result: ${isPdf}`);
  return isPdf;
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
        error: `Only PDF files are supported. Please convert your document to PDF format and try again.

📄 To convert your document to PDF:
• Microsoft Word: File → Save As → PDF
• Google Docs: File → Download → PDF Document (.pdf)  
• Online tools: Use SmallPDF, ILovePDF, or similar converters

💡 Why PDF only?
PDF files provide the most reliable text extraction for AI processing.`
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

    console.log(`Processing file with Gemini Files API: ${file.name} (${file.size} bytes)`);
    
    // Step 1: Upload file to Gemini Files API
    let fileInfo;
    try {
      console.log(`[Step 1] Attempting to upload file to Gemini Files API...`);
      fileInfo = await uploadFileToGemini(file);
      console.log(`[Step 1] ✅ File upload successful:`, {
        name: fileInfo.name,
        uri: fileInfo.uri,
        mimeType: fileInfo.mimeType,
        state: fileInfo.state
      });
      
      // Check if file needs time to process
      if (fileInfo.state && fileInfo.state === 'PROCESSING') {
        console.log(`[Step 1.5] File is still processing, waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check file status
        try {
          const { getFileInfo } = await import('@/services/geminiService');
          const updatedFileInfo = await getFileInfo(fileInfo.name!);
          console.log(`[Step 1.5] Updated file status:`, updatedFileInfo.state);
          fileInfo = updatedFileInfo;
        } catch (statusError) {
          console.warn(`[Step 1.5] Could not check file status:`, statusError);
          // Continue anyway
        }
      }
    } catch (uploadError) {
      console.error(`[Step 1] ❌ File upload failed:`, uploadError);
      return {
        success: false,
        error: `File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown upload error'}`
      };
    }

    try {
      // Step 2: Extract content using the Files API
      console.log(`[Step 2] Attempting to extract content from uploaded file...`);
      console.log(`[Step 2] File details for extraction:`, {
        name: fileInfo.name,
        uri: fileInfo.uri,
        mimeType: fileInfo.mimeType,
        state: fileInfo.state,
        sizeBytes: fileInfo.sizeBytes
      });
      
      // Special handling for DOCX files - they might need additional wait time
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === '.docx' && fileInfo.state === 'PROCESSING') {
        console.log(`[Step 2] DOCX file detected, waiting additional time for processing...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Extra wait for DOCX
      }
      
      const extractionResult = await extractKeyTermsFromFile(fileInfo, mode);
      console.log(`[Step 2] ✅ Content extraction successful: ${extractionResult.keyTerms.length} terms found`);
      
      // Step 3: Clean up the uploaded file
      try {
        console.log(`[Step 3] Cleaning up uploaded file...`);
        await deleteFileFromGemini(fileInfo.name);
        console.log(`[Step 3] ✅ File ${fileInfo.name} cleaned up successfully`);
      } catch (cleanupError) {
        console.warn(`[Step 3] ⚠️ Failed to clean up file ${fileInfo.name}:`, cleanupError);
        // Don't fail the entire operation if cleanup fails
      }

      // For backward compatibility, also provide extracted text
      const extractedText = extractionResult.keyTerms
        .map(term => `${term.term}: ${term.meaning}`)
        .join('\n\n');

      return {
        success: true,
        text: extractedText,
        extractionResult,
        fileId: fileInfo.name
      };
    } catch (processingError) {
      console.error(`[Step 2] ❌ Content extraction failed:`, processingError);
      
      // Simplified error message for PDF files
      let errorMessage = `PDF processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown extraction error'}`;
      
      // If processing fails, still try to clean up the uploaded file
      try {
        console.log(`[Step 3] Attempting cleanup after extraction failure...`);
        await deleteFileFromGemini(fileInfo.name);
        console.log(`[Step 3] ✅ File ${fileInfo.name} cleaned up after processing error`);
      } catch (cleanupError) {
        console.warn(`[Step 3] ⚠️ Failed to clean up file ${fileInfo.name} after processing error:`, cleanupError);
      }
      
      return {
        success: false,
        error: errorMessage
      };
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
