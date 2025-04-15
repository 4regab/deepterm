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
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
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
              .map((item: any) => item.str)
              .join(' ');
            
            extractedText += pageText + "\n\n";
          }
          
          const cleanedText = extractedText
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
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
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
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
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
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

export const exportAsPDF = (result: ExtractionResult) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    }) as ExtendedJsPDF;
    
    const marginLeft = 0.5;
    const marginRight = 0.5;
    const marginTop = 0.5;
    const marginBottom = 0.75;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const useColumns = true;
    const columnGap = 0.3;
    const contentWidth = pageWidth - (marginLeft + marginRight);
    const columnWidth = useColumns ? (contentWidth - columnGap) / 2 : contentWidth;
    
    let currentPage = 1;
    let currentColumn = 0;
    let xPos = marginLeft;
    let yPos = marginTop;
    
    const TITLE_FONT_SIZE = 12;
    const HEADING_FONT_SIZE = 11;
    const CONTENT_FONT_SIZE = 10;
    const SMALL_FONT_SIZE = 8;
    
    const LINE_HEIGHT = 0.2;
    const TITLE_LINE_HEIGHT = 0.25;
    const SECTION_GAP = 0.15;
    const TERM_SPACING = 0.3;
    
    const TERM_COLOR = "#000000";
    const TEXT_COLOR = "#000000";
    const HIGHLIGHT_COLOR = "#1A1F2C";
    
    const addFooter = (pageNum: number) => {
      doc.setPage(pageNum);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(SMALL_FONT_SIZE);
      const footerText = `Page ${pageNum} | Generated on ${new Date().toLocaleDateString()}`;
      const textWidth = doc.getTextWidth(footerText);
      const footerX = (pageWidth - textWidth) / 2;
      doc.text(footerText, footerX, pageHeight - 0.3);
    };
    
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
    
    if (result.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(TITLE_FONT_SIZE);
      doc.setTextColor(HIGHLIGHT_COLOR);
      
      if (result.title.toLowerCase().includes("lesson")) {
        doc.text(result.title, marginLeft, yPos);
        yPos += TITLE_LINE_HEIGHT;
      } else {
        doc.text(`Lesson: ${result.title}`, marginLeft, yPos);
        yPos += TITLE_LINE_HEIGHT;
      }
    }
    
    result.keyTerms.forEach((term, index) => {
      const termContentHeight = 
        LINE_HEIGHT +
        (term.meaning ? term.meaning.length / 90 * LINE_HEIGHT : 0) +
        (term.subcategories?.length || 0) * LINE_HEIGHT +
        (term.examples?.length || 0) * LINE_HEIGHT;
      
      const positionChanged = checkColumnAndPage(termContentHeight);
      
      xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(HEADING_FONT_SIZE);
      doc.setTextColor(TERM_COLOR);
      doc.text(term.term, xPos, yPos);
      
      yPos += LINE_HEIGHT;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(CONTENT_FONT_SIZE);
      doc.setTextColor(TEXT_COLOR);
      
      if (term.meaning && term.meaning.toLowerCase().includes("means")) {
        const effectiveWidth = columnWidth - 0.1;
        const meaningLines = doc.splitTextToSize(term.meaning, effectiveWidth);
        
        meaningLines.forEach((line: string) => {
          doc.text(line, xPos, yPos);
          yPos += LINE_HEIGHT;
        });
      } else {
        const effectiveWidth = columnWidth - 0.1;
        
        if (term.meaning) {
          const formattedMeaning = `- ${term.meaning}`;
          const meaningLines = doc.splitTextToSize(formattedMeaning, effectiveWidth);
          
          meaningLines.forEach((line: string, lineIndex: number) => {
            if (checkColumnAndPage()) {
              xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
            }
            
            if (lineIndex === 0) {
              doc.text(line, xPos, yPos);
            } else {
              doc.text(line, xPos, yPos);
            }
            
            yPos += LINE_HEIGHT;
          });
        }
      }
      
      if (term.subcategories && term.subcategories.length > 0) {
        yPos += LINE_HEIGHT * 0.5;
        
        term.subcategories.forEach((subcategory) => {
          if (checkColumnAndPage()) {
            xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
          }
          
          const effectiveWidth = columnWidth - 0.2;
          const subLines = doc.splitTextToSize(subcategory, effectiveWidth);
          
          subLines.forEach((line: string, lineIndex: number) => {
            if (checkColumnAndPage()) {
              xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
            }
            
            if (lineIndex === 0) {
              doc.text(`• ${line}`, xPos + 0.1, yPos);
            } else {
              doc.text(`  ${line}`, xPos + 0.1, yPos);
            }
            
            yPos += LINE_HEIGHT;
          });
        });
      }
      
      if (term.examples && term.examples.length > 0) {
        yPos += LINE_HEIGHT * 0.5;
        
        term.examples.forEach((example) => {
          if (checkColumnAndPage()) {
            xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
          }
          
          const cleanedExample = example.replace(/^[\s•\-–—*]+/, '').trim();
          const effectiveWidth = columnWidth - 0.2;
          const exampleLines = doc.splitTextToSize(`• ${cleanedExample}`, effectiveWidth);
          
          exampleLines.forEach((line: string, lineIndex: number) => {
            if (checkColumnAndPage()) {
              xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
            }
            
            if (lineIndex === 0) {
              doc.text(line, xPos + 0.1, yPos);
            } else {
              doc.text(`  ${line.substring(2)}`, xPos + 0.1, yPos);
            }
            
            yPos += LINE_HEIGHT;
          });
        });
      }
      
      if (term.keywords && term.keywords.length > 0) {
        yPos += LINE_HEIGHT * 0.5;
        
        if (checkColumnAndPage()) {
          xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
        }
        
        const keywordsText = term.keywords.join(", ");
        const effectiveWidth = columnWidth - 0.2;
        const keywordLines = doc.splitTextToSize(keywordsText, effectiveWidth);
        
        doc.setFont("helvetica", "italic");
        keywordLines.forEach((line: string) => {
          if (checkColumnAndPage()) {
            xPos = currentColumn === 0 ? marginLeft : marginLeft + columnWidth + columnGap;
          }
          
          doc.text(line, xPos + 0.1, yPos);
          yPos += LINE_HEIGHT;
        });
        doc.setFont("helvetica", "normal");
      }
      
      yPos += TERM_SPACING;
    });
    
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      addFooter(i);
    }
    
    const filename = `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extracted_terms.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};

export const exportAsCSV = (result: ExtractionResult) => {
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
  saveAs(blob, `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extracted_terms.csv`);
};

export const exportAsDocx = (result: ExtractionResult) => {
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
      saveAs(blob, `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_extracted_terms.docx`);
    });
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate DOCX. Please try again.");
  }
};
