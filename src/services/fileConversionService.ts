// File conversion service for handling problematic file formats
import { ExtractionResult, ExtractionMode } from '@/types';

// Convert DOCX to plain text using browser APIs when possible
export const convertDocxToText = async (file: File): Promise<string> => {
  // Note: This is a simplified approach. For production, you'd want to use
  // a proper DOCX parsing library like mammoth.js or docx-preview
  
  try {
    // Read file as array buffer (currently unused, but required for future DOCX parsing)
    // const arrayBuffer = await file.arrayBuffer();
    
    // For now, return a message indicating we need a conversion service
    // In a real implementation, you would use a library like mammoth.js:
    // const mammoth = await import('mammoth');
    // const result = await mammoth.extractRawText({ arrayBuffer });
    // return result.value;
    
    return `[DOCX Content - File: ${file.name}, Size: ${file.size} bytes]
This DOCX file needs to be converted to extract text content.
Please save this document as a PDF or plain text file for better compatibility.`;
    
  } catch (error) {
    throw new Error(`Failed to convert DOCX file: ${error}`);
  }
};

// Alternative processing for DOCX files using text conversion
export const processDocxAlternative = async (
  file: File,
  mode: ExtractionMode = "full"
): Promise<ExtractionResult> => {
  try {
    console.log('[DOCX Alternative] Starting alternative DOCX processing...');
    
    // Convert to text (placeholder implementation)
    const textContent = await convertDocxToText(file);
    
    // Create a basic extraction result
    const result: ExtractionResult = {
      title: file.name.replace('.docx', ''),
      extractionMode: mode,
      keyTerms: [
        {
          term: "Document Content",
          meaning: "This DOCX file was processed using alternative text extraction",
          category: "File Processing",
          subcategories: ["DOCX", "Alternative Processing"],
          examples: [textContent.substring(0, 100) + "..."]
        },
        {
          term: "Processing Note",
          meaning: "DOCX files may require conversion to PDF or plain text for optimal results",
          category: "Technical Note",
          subcategories: ["File Format", "Compatibility"],
          examples: ["Save as PDF", "Save as TXT", "Use online converter"]
        }
      ]
    };
    
    return result;
    
  } catch (error) {
    throw new Error(`Alternative DOCX processing failed: ${error}`);
  }
};

// Enhanced error handling with specific DOCX guidance
export const getDocxErrorGuidance = (error: Error | unknown): string => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'Unknown error';
  
  if (errorMessage.includes('INVALID_ARGUMENT')) {
    return `DOCX File Processing Error: The Gemini API encountered an issue processing this DOCX file.

Common solutions:
1. Convert to PDF: Save your document as PDF (File → Save As → PDF)
2. Save as plain text: Save as .txt file for simple text extraction
3. Simplify formatting: Remove complex formatting, images, or embedded objects
4. Check file integrity: Ensure the DOCX file isn't corrupted
5. Reduce file size: Large DOCX files (>10MB) may have issues

Technical details: ${errorMessage}`;
  }
  
  if (errorMessage.includes('file size') || errorMessage.includes('large')) {
    return `DOCX File Too Large: This DOCX file is too large for processing.

Solutions:
1. Reduce file size by removing images or unnecessary content
2. Split large documents into smaller sections
3. Convert to PDF which often compresses better
4. Use file compression tools before upload

Technical details: ${errorMessage}`;
  }
  
  return `DOCX Processing Error: ${errorMessage}

General troubleshooting:
1. Try converting to PDF format
2. Check if file is password-protected or encrypted
3. Ensure file is not corrupted
4. Try with a simpler DOCX file to test the system`;
};

// Install mammoth.js for proper DOCX conversion (placeholder command)
export const installDocxConverter = () => {
  console.log(`
To enable proper DOCX text conversion, install mammoth.js:

npm install mammoth

Then update the convertDocxToText function to use:
import mammoth from 'mammoth';

const result = await mammoth.extractRawText({ arrayBuffer });
return result.value;
  `);
};