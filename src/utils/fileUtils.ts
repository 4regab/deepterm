import { ExtractionResult } from "@/types";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, convertInchesToTwip, HeadingLevel, BorderStyle } from "docx";
import jsPDF from 'jspdf';
import { jsPDF as _jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

type ExtendedJsPDF = _jsPDF & {
  autoTable: typeof autoTable;
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const cleanedText = reader.result
            .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ')
            .replace(/�/g, ' ');
          
          resolve(cleanedText);
        } else {
          reject(new Error("FileReader did not return a string"));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error("Error reading file"));
      };
      
      reader.readAsText(file, 'UTF-8');
    } 
    else if (file.name.endsWith('.pdf')) {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          if (!reader.result) {
            throw new Error("Empty PDF content");
          }
          
          const pdfData = reader.result;
          
          console.log(`PDF.js using worker from: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
          
          pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
          
          const loadingTask = pdfjsLib.getDocument({data: pdfData});
          const pdf = await loadingTask.promise;
          
          console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
          
          let extractedText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            const pageText = content.items
              .map((item) => 'str' in item ? item.str : '')
              .join(' ');
            
            extractedText += pageText + "\n\n";
          }
          
          const cleanedText = extractedText
            .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ')
            .replace(/�/g, ' ');
          
          resolve(cleanedText);
        } catch (error) {
          console.error("PDF extraction error:", error);
          reject(new Error("Failed to extract text from PDF: " + (error instanceof Error ? error.message : String(error))));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error("Error reading PDF file"));
      };
      
      reader.readAsArrayBuffer(file);
    }
    else if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          if (!reader.result) {
            throw new Error("Empty DOCX content");
          }
          
          const docxData = reader.result;
          
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({
            arrayBuffer: docxData as ArrayBuffer
          });
          
          const cleanedText = result.value
            .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ')
            .replace(/�/g, ' ');
          
          resolve(cleanedText);
        } catch (error) {
          console.error("DOCX extraction error:", error);
          reject(new Error("Failed to extract text from DOCX: " + (error instanceof Error ? error.message : String(error))));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error("Error reading DOCX file"));
      };
      
      reader.readAsArrayBuffer(file);
    }
    else {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const cleanedText = reader.result
            .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n\r]/gu, ' ')
            .replace(/�/g, ' ');
          
          resolve(cleanedText);
        } else {
          reject(new Error("FileReader did not return a string"));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error("Error reading file"));
      };
      
      reader.readAsText(file, 'UTF-8');
    }
  });
};

export const exportAsPDF = (result: ExtractionResult, originalFilename?: string) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    }) as ExtendedJsPDF;
    
    // Set Helvetica as default font (standard in jsPDF)
    doc.setFont('helvetica'); 
    
    // Page setup and margins - minimized for transes notes style
    const marginLeft = 0.30;
    const marginRight = 0.30;
    const marginTop = 0.30;
    const marginBottom = 0.30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Column configuration - optimized for space efficiency
    const useColumns = true;
    const columnGap = 0.25; // Reduced gap between columns
    const contentWidth = pageWidth - (marginLeft + marginRight);
    const columnWidth = useColumns ? (contentWidth - columnGap) / 2 : contentWidth;
    
    // Position tracking
    let currentPage = 1;
    let currentColumn = 0;
    let xPos = marginLeft;
    let yPos = marginTop;
    
    // Font sizes - consistent size 10, footer size 5
    const TITLE_FONT_SIZE = 10;
    const HEADING_FONT_SIZE = 10;
    const CONTENT_FONT_SIZE = 10;
    const SMALL_FONT_SIZE = 10 // Changed footer size to 5
    
    // Spacing - standardized for consistency
    const LINE_HEIGHT = 0.18; // Standardized base line height
    const LINE_HEIGHT_MULTIPLIER = 1.2; // Consistent multiplier for all text
    const TITLE_LINE_HEIGHT = LINE_HEIGHT * LINE_HEIGHT_MULTIPLIER;
    const SECTION_GAP = 0.20;
    const TERM_SPACING = 0.10; 
    const INDENT_SIZE = 0.15;
    
    // Colors
    const TERM_COLOR = "#000000";
    const TEXT_COLOR = "#333333";
    const HIGHLIGHT_COLOR = "#000000";
    
    // Add a footer to each page
    const addFooter = (pageNum: number) => {
      // Save current font size to restore it after adding the footer
      const currentFontSize = doc.getFontSize();
      
      doc.setPage(pageNum);
      doc.setFont("helvetica", "normal"); // Ensure footer uses Helvetica
      doc.setFontSize(5); // Set footer font size directly to 5
      const footerText = `${pageNum}`;
      const textWidth = doc.getTextWidth(footerText);
      const footerX = (pageWidth - textWidth) / 2;
      doc.text(footerText, footerX, pageHeight - 0.3);
      
      // Restore the original font size so subsequent text isn't affected
      doc.setFontSize(currentFontSize);
    };
    
    // Check if we need to move to a new column or page
    const checkColumnAndPage = (requiredSpace = LINE_HEIGHT) => {
      const spaceNeeded = requiredSpace + 0.1;
      
      if (yPos > pageHeight - marginBottom - spaceNeeded) {
        if (useColumns && currentColumn === 0) {
          currentColumn = 1;
          xPos = marginLeft + columnWidth + columnGap;
          yPos = marginTop;
          return true;
        } else {
          doc.addPage();
          currentPage++;
          addFooter(currentPage);
          currentColumn = 0;
          xPos = marginLeft;
          yPos = marginTop;
          return true;
        }
      }
      return false;
    };
    
    addFooter(currentPage);
    
    // Group terms by category if available
    const groupedTerms: Record<string, typeof result.keyTerms> = {};
    result.keyTerms.forEach(term => {
      const category = term.category || "Main Concepts";
      if (!groupedTerms[category]) {
        groupedTerms[category] = [];
      }
      groupedTerms[category].push(term);
    });
    
    // Add the title at the beginning of the first column
    if (result.title) {
      doc.setFont("helvetica", "bold"); // Use Helvetica
      doc.setFontSize(TITLE_FONT_SIZE);
      doc.setTextColor(0, 0, 0);
      
      const title = result.title.toUpperCase();
      doc.text(title, xPos, yPos);
      
      // Using standardized line height
      yPos += TITLE_LINE_HEIGHT;
      
      // Add subtitle if extraction mode is available
      if (result.extractionMode) {
        const modeName = result.extractionMode === "full" ? "Complete Notes" : 
                       result.extractionMode === "sentence" ? "One-Sentence Summary" : 
                       "Key Concepts";
        
        // Keep consistent spacing even when changing font style
        doc.setFont("helvetica", "normal");
        doc.setFontSize(CONTENT_FONT_SIZE); 
        doc.text(`Format: ${modeName}`, xPos, yPos);
        yPos += TITLE_LINE_HEIGHT;
      }
      
      // Add a separation line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.01);
      doc.line(xPos, yPos, xPos + columnWidth, yPos);
      yPos += LINE_HEIGHT;
    }
    
    // Process terms by category
    Object.entries(groupedTerms).forEach(([category, terms], categoryIndex) => {
      // Add category header
      if (categoryIndex > 0) {
        yPos += SECTION_GAP;
      }
      
      checkColumnAndPage(LINE_HEIGHT * 2);
      
      xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
      
      // Category heading (no underline)
      doc.setFont("helvetica", "normal"); // Use Helvetica
      doc.setFontSize(HEADING_FONT_SIZE);
      doc.setTextColor(HIGHLIGHT_COLOR);
      doc.text(category.toUpperCase(), xPos, yPos);
      
      // Use standardized spacing throughout document
      yPos += TITLE_LINE_HEIGHT;
      
      // Process each term in this category
      terms.forEach((term, index) => {
        const termContentHeight = 
          TITLE_LINE_HEIGHT + // Use consistent title line height
          (term.meaning ? term.meaning.length / 70 * LINE_HEIGHT : 0) +
          (term.subcategories?.length || 0) * TITLE_LINE_HEIGHT + 
          (term.examples?.length || 0) * TITLE_LINE_HEIGHT;
        
        const positionChanged = checkColumnAndPage(termContentHeight);
        
        if (positionChanged) {
          xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
        }
        
        // Term name (normal, not bold)
        doc.setFont("helvetica", "normal"); // Use Helvetica
        doc.setFontSize(HEADING_FONT_SIZE);
        doc.setTextColor(TERM_COLOR);
        doc.text(`${index + 1}. ${term.term}`, xPos, yPos);
        
        yPos += LINE_HEIGHT;
        
        // Term meaning/definition (normal text, indented)
        doc.setFont("helvetica", "normal"); // Use Helvetica
        doc.setFontSize(CONTENT_FONT_SIZE);
        doc.setTextColor(TEXT_COLOR);
        
        if (term.meaning) {
          const effectiveWidth = columnWidth - INDENT_SIZE;
          const meaningLines = doc.splitTextToSize(term.meaning, effectiveWidth);
          
          // Set increased line spacing (1.2x) for the content after the term title (reduced from 1.5)
          const increasedLineHeight = LINE_HEIGHT * 1.2; 
          
          meaningLines.forEach((line: string) => {
            checkColumnAndPage();
            doc.text(line, xPos + INDENT_SIZE, yPos);
            yPos += increasedLineHeight;
          });
        }
        
        // Handle subcategories with lettered bullets (a, b, c...)
        if (term.subcategories && term.subcategories.length > 0) {
          yPos += LINE_HEIGHT * 0.2; // Reduced from 0.3
          
          if (term.subcategoryTitle) {
            doc.setFont("helvetica", "normal"); // Use Helvetica
            checkColumnAndPage();
            doc.text(term.subcategoryTitle + ":", xPos + INDENT_SIZE, yPos);
            yPos += LINE_HEIGHT;
            doc.setFont("helvetica", "normal"); // Use Helvetica
          }
          
          term.subcategories.forEach((subcategory, subIndex) => {
            checkColumnAndPage();
            
            // Use alphabetical bullets (a, b, c...)
            const bullet = String.fromCharCode(97 + subIndex); // 97 is ASCII for 'a'
            const bulletText = `${bullet}. `;
            
            const effectiveWidth = columnWidth - (INDENT_SIZE * 2 + doc.getTextWidth(bulletText));
            const subLines = doc.splitTextToSize(subcategory, effectiveWidth);
            
            // First line with bullet
            checkColumnAndPage();
            doc.text(bulletText, xPos + INDENT_SIZE, yPos);
            doc.text(subLines[0], xPos + INDENT_SIZE * 2, yPos);
            yPos += LINE_HEIGHT * 1.2; // Reduced from 1.5
            
            // Remaining lines indented
            for (let i = 1; i < subLines.length; i++) {
              checkColumnAndPage();
              doc.text(subLines[i], xPos + INDENT_SIZE * 2, yPos);
              yPos += LINE_HEIGHT * 1.2; // Reduced from 1.5
            }
          });
        }
        
        // Handle examples
        if (term.examples && term.examples.length > 0) {
          yPos += LINE_HEIGHT * 0.2; // Reduced from 0.3
          
          doc.setFont("helvetica", "normal"); // Use Helvetica
          checkColumnAndPage();
          doc.text("Examples:", xPos + INDENT_SIZE, yPos);
          yPos += LINE_HEIGHT * 1.2; // Reduced from 1.5
          doc.setFont("helvetica", "normal"); // Use Helvetica
          
          term.examples.forEach((example, exIndex) => {
            const cleanedExample = example.replace(/^[\s•\-–—*]+/, '').trim();
            
            // Use the same bullet style as used in the original document
            // Using circular bullet with proper spacing
            const bulletText = "• ";
            const bulletWidth = doc.getTextWidth(bulletText);
            
            const effectiveWidth = columnWidth - (INDENT_SIZE * 2 + bulletWidth);
            const exampleLines = doc.splitTextToSize(cleanedExample, effectiveWidth);
            
            // First line with bullet
            checkColumnAndPage();
            doc.text(bulletText, xPos + INDENT_SIZE, yPos);
            doc.text(exampleLines[0], xPos + INDENT_SIZE + bulletWidth, yPos);
            yPos += LINE_HEIGHT * 1.2;
            
            // Remaining lines indented (aligned with text, not with bullet)
            for (let i = 1; i < exampleLines.length; i++) {
              checkColumnAndPage();
              doc.text(exampleLines[i], xPos + INDENT_SIZE + bulletWidth, yPos);
              yPos += LINE_HEIGHT * 1.2;
            }
          });
        }
        
        // Keywords if available (in keywords mode)
        if (term.keywords && term.keywords.length > 0) {
          yPos += LINE_HEIGHT * 0.2; // Reduced from 0.3
          
          checkColumnAndPage();
          doc.setFont("helvetica", "normal"); // Use Helvetica
          doc.text("Keywords:", xPos + INDENT_SIZE, yPos);
          yPos += LINE_HEIGHT;
          
          const keywordsText = term.keywords.join(", ");
          const effectiveWidth = columnWidth - INDENT_SIZE * 2;
          const keywordLines = doc.splitTextToSize(keywordsText, effectiveWidth);
          
          keywordLines.forEach((line: string) => {
            checkColumnAndPage();
            doc.setFont("helvetica", "normal"); // Use Helvetica
            doc.text(line, xPos + INDENT_SIZE * 2, yPos);
            yPos += LINE_HEIGHT;
          });
        }
        
        // Add space between terms
        yPos += TERM_SPACING;
      });
    });
    
    // Add footer to all pages
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      addFooter(i);
    }
    
    // Generate sequential "Reviewer N" filename
    const date = new Date();
    const timestamp = date.getTime(); // Use timestamp to ensure uniqueness
    const reviewerNumber = Math.floor((timestamp % 1000) / 100) + 1; // Generate a number between 1-10
    const filename = `Reviewer ${reviewerNumber}.pdf`;
    
    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};

export const exportAsCSV = (result: ExtractionResult, originalFilename?: string) => {
  const csvRows = [];

  csvRows.push("Term,Meaning,Subcategories,Examples");

  result.keyTerms.forEach(term => {
    const termValue = term.term.replace(/,/g, '');
    const meaning = term.meaning.replace(/,/g, ';');
    const subcategories = term.subcategories ? term.subcategories.join(';').replace(/,/g, ';') : '';
    const examples = term.examples ? term.examples.map(ex => ex.replace(/,/g, ';')).join(';') : '';
    csvRows.push(`${termValue},"${meaning}","${subcategories}","${examples}"`);
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  
  // Generate filename based on original file if available, otherwise use the title
  let filename = '';
  if (originalFilename) {
    // Extract just the base name without extension
    const baseName = originalFilename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    filename = `${baseName}_extracted_terms.csv`;
  } else {
    filename = `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extracted_terms.csv`;
  }
  
  saveAs(blob, filename);
};

export const exportAsDocx = (result: ExtractionResult, originalFilename?: string) => {
  try {
    const document = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: result.title,
                bold: true,
                size: 24,
                font: "Arial",
              }),
            ],
            spacing: {
              line: 360,
              after: 240,
            },
          }),
          ...result.keyTerms.map((term, index) => {
            const children = [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${term.term}`,
                    bold: true,
                    size: 20,
                    font: "Arial",
                  }),
                ],
                spacing: {
                  line: 360,
                  after: 120,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: term.meaning,
                    size: 20,
                    font: "Arial",
                  }),
                ],
                spacing: {
                  line: 360,
                  after: 240,
                },
              }),
            ];

            if (term.subcategories && term.subcategories.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${term.subcategoryTitle || "Types"}:`,
                      italics: true,
                      size: 20,
                      font: "Arial",
                    }),
                  ],
                  spacing: {
                    line: 360,
                    before: 120,
                    after: 120,
                  },
                })
              );
              
              term.subcategories.forEach(subcategory => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${subcategory}`,
                        size: 20,
                        font: "Arial",
                      }),
                    ],
                    indent: {
                      left: convertInchesToTwip(0.25),
                    },
                    spacing: {
                      line: 360,
                    },
                  })
                );
              });
            }

            if (term.examples && term.examples.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Examples:",
                      italics: true,
                      size: 20,
                      font: "Arial",
                    }),
                  ],
                  spacing: {
                    line: 360,
                    before: 120,
                    after: 120,
                  },
                })
              );
              
              term.examples.forEach(example => {
                const cleanedExample = example.replace(/^[\s•\-–—*]+/, '').trim();
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${cleanedExample}`,
                        size: 20,
                        font: "Arial",
                      }),
                    ],
                    indent: {
                      left: convertInchesToTwip(0.25),
                    },
                    spacing: {
                      line: 360,
                    },
                  })
                );
              });
            }

            if (result.extractionMode === "keywords" && term.keywords && term.keywords.length > 0) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Keywords:",
                      italics: true,
                      size: 20,
                      font: "Arial",
                    }),
                  ],
                  spacing: {
                    line: 360,
                    before: 120,
                    after: 120,
                  },
                })
              );
              
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: term.keywords.join(", "),
                      size: 20,
                      font: "Arial",
                    }),
                  ],
                  indent: {
                    left: convertInchesToTwip(0.25),
                  },
                  spacing: {
                    line: 360,
                    after: 240,
                  },
                })
              );
            }

            children.push(
              new Paragraph({
                text: "",
                spacing: {
                  after: 240,
                },
              })
            );
            
            return children;
          }).reduce((acc, val) => acc.concat(val), []),
        ],
      }],
    });

    Packer.toBlob(document).then(blob => {
      // Generate filename based on original file if available, otherwise use the title
      let filename = '';
      if (originalFilename) {
        // Extract just the base name without extension
        const baseName = originalFilename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `${baseName}_extracted_terms.docx`;
      } else {
        filename = `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extracted_terms.docx`;
      }
      
      saveAs(blob, filename);
    });
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate DOCX. Please try again.");
  }
};
