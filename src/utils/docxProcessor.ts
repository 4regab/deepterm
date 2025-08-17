/**
 * Client-side DOCX processing utility using mammoth.js
 * This provides a fallback option for DOCX files when server-side processing fails
 */

import mammoth from 'mammoth';

export interface DocxProcessingResult {
  success: boolean;
  text?: string;
  error?: string;
  wordCount?: number;
}

/**
 * Process a DOCX file on the client side using mammoth.js
 * @param file - The DOCX file to process
 * @returns Promise with processing result
 */
export async function processDocxFile(file: File): Promise<DocxProcessingResult> {
  try {
    console.log(`[DocxProcessor] Starting client-side processing of ${file.name}`);
    
    // Verify this is a DOCX file
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return {
        success: false,
        error: 'File is not a DOCX document'
      };
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      return {
        success: false,
        error: 'No text content found in the DOCX file'
      };
    }

    const extractedText = result.value.trim();
    const wordCount = extractedText.split(/\s+/).length;

    console.log(`[DocxProcessor] Successfully extracted ${extractedText.length} characters (${wordCount} words)`);
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('[DocxProcessor] Mammoth warnings:', result.messages);
    }

    return {
      success: true,
      text: extractedText,
      wordCount
    };

  } catch (error) {
    console.error('[DocxProcessor] Client-side processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during DOCX processing'
    };
  }
}

/**
 * Check if a file is a DOCX document
 * @param file - File to check
 * @returns true if the file appears to be a DOCX document
 */
export function isDocxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.docx') || 
         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

/**
 * Get estimated processing time for a DOCX file
 * @param file - DOCX file
 * @returns estimated processing time in milliseconds
 */
export function getEstimatedProcessingTime(file: File): number {
  // Rough estimate: 100ms base + 10ms per KB
  const sizeKB = file.size / 1024;
  return Math.max(500, 100 + (sizeKB * 10));
}