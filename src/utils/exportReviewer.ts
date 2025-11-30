import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

interface Term {
  front: string;
  back: string;
}

interface Category {
  name: string;
  terms: Term[];
}

interface ExportOptions {
  title: string;
  terms: Term[];
  categories?: Category[];
}

export async function exportToPDF({ title, terms, categories }: ExportOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 0.5; // 0.5 inch margin
  const gutter = 0.25; // gap between columns
  const colWidth = (pageWidth - margin * 2 - gutter) / 2;
  const fontSize = 12;
  const lineHeight = 0.18; // line height in inches for 12pt
  const maxY = pageHeight - margin;

  // Title at top
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), margin, margin + 0.2);

  // Build content items with category info
  interface ContentItem {
    category?: string;
    term: string;
    definition: string;
  }

  const items: ContentItem[] = [];
  
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      for (const t of cat.terms) {
        items.push({ category: cat.name, term: t.front, definition: t.back });
      }
    }
  } else {
    for (const t of terms) {
      items.push({ term: t.front, definition: t.back });
    }
  }

  let leftY = margin + 0.5;
  let rightY = margin + 0.5;
  let lastCategory = ""; // Single category tracker across both columns
  let leftColumnFull = false;

  // Helper to draw justified text
  const drawJustifiedText = (text: string, x: number, y: number, maxWidth: number): number => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    let posY = y;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isLastLine = i === lines.length - 1;

      if (isLastLine || line.trim().length === 0) {
        doc.text(line, x, posY);
      } else {
        const words = line.split(" ").filter((w: string) => w.length > 0);
        if (words.length <= 1) {
          doc.text(line, x, posY);
        } else {
          const totalSpaceWidth = maxWidth - doc.getTextWidth(words.join(""));
          const spaceWidth = totalSpaceWidth / (words.length - 1);
          let xPos = x;
          for (let j = 0; j < words.length; j++) {
            doc.text(words[j], xPos, posY);
            xPos += doc.getTextWidth(words[j]) + spaceWidth;
          }
        }
      }
      posY += lineHeight;
    }
    return posY;
  };

  const getItemHeight = (item: ContentItem, lastCat: string, isFirstInColumn: boolean): number => {
    doc.setFontSize(fontSize);
    const termLines = doc.splitTextToSize(item.term, colWidth);
    const defLines = doc.splitTextToSize(item.definition, colWidth);
    let height = (termLines.length + defLines.length) * lineHeight + 0.12;
    // Only add category height if it's a NEW category (different from last)
    if (item.category && item.category !== lastCat) {
      const catLines = doc.splitTextToSize(item.category.toUpperCase(), colWidth);
      const catHeight = catLines.length * lineHeight;
      // Space before category (0 if first in column, 0.2 otherwise) + category text + space after (0.15)
      height += (isFirstInColumn ? 0 : 0.2) + catHeight + 0.15;
    }
    return height;
  };

  const drawItem = (item: ContentItem, x: number, y: number, lastCat: string, isFirstInColumn: boolean): { newY: number; newLastCat: string } => {
    let currentY = y;
    let updatedLastCat = lastCat;

    // Draw category header ONLY if it's a different category
    if (item.category && item.category !== lastCat) {
      if (!isFirstInColumn) {
        currentY += 0.2; // Space before new category (not at top of column)
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      // Handle multi-line category titles
      const catLines = doc.splitTextToSize(item.category.toUpperCase(), colWidth);
      for (const line of catLines) {
        doc.text(line, x, currentY);
        currentY += lineHeight;
      }
      currentY += 0.15; // Space after category title
      updatedLastCat = item.category;
    }

    // Draw term in bold
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const termLines = doc.splitTextToSize(item.term, colWidth);
    for (const line of termLines) {
      doc.text(line, x, currentY);
      currentY += lineHeight;
    }

    // Draw definition justified
    currentY = drawJustifiedText(item.definition, x, currentY, colWidth);
    currentY += 0.12; // Space between items

    return { newY: currentY, newLastCat: updatedLastCat };
  };

  let isFirstInLeftCol = true;
  let isFirstInRightCol = true;

  // Fill left column completely first, then right column
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!leftColumnFull) {
      // Try to fit in left column
      const itemHeight = getItemHeight(item, lastCategory, isFirstInLeftCol);
      if (leftY + itemHeight > maxY) {
        // Left column is now full, switch to right
        leftColumnFull = true;
        // Don't reset lastCategory - continue tracking across columns
      } else {
        const result = drawItem(item, margin, leftY, lastCategory, isFirstInLeftCol);
        leftY = result.newY;
        lastCategory = result.newLastCat;
        isFirstInLeftCol = false;
        continue;
      }
    }
    
    // Right column - use same lastCategory to avoid duplicate headers
    const itemHeight = getItemHeight(item, lastCategory, isFirstInRightCol);
    if (rightY + itemHeight > maxY) {
      // Both columns full, new page
      doc.addPage();
      leftY = margin + 0.2;
      rightY = margin + 0.2;
      leftColumnFull = false;
      isFirstInLeftCol = true;
      isFirstInRightCol = true;
      // Keep lastCategory to avoid repeating on new page if same category continues
      
      // Start on left column of new page
      const result = drawItem(item, margin, leftY, lastCategory, isFirstInLeftCol);
      leftY = result.newY;
      lastCategory = result.newLastCat;
      isFirstInLeftCol = false;
    } else {
      const result = drawItem(item, margin + colWidth + gutter, rightY, lastCategory, isFirstInRightCol);
      rightY = result.newY;
      lastCategory = result.newLastCat;
      isFirstInRightCol = false;
    }
  }

  doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
}

export async function exportToDOCX({ title, terms, categories }: ExportOptions) {
  // Build content with categories
  interface ContentItem {
    category?: string;
    term: string;
    definition: string;
  }

  const items: ContentItem[] = [];
  
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      for (const t of cat.terms) {
        items.push({ category: cat.name, term: t.front, definition: t.back });
      }
    }
  } else {
    for (const t of terms) {
      items.push({ term: t.front, definition: t.back });
    }
  }

  // Split into two columns - fill first column completely
  const midpoint = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);
  const maxRows = Math.max(leftItems.length, rightItems.length);

  const tableRows: TableRow[] = [];
  let lastLeftCategory = "";
  let lastRightCategory = "";

  for (let i = 0; i < maxRows; i++) {
    const leftItem = leftItems[i];
    const rightItem = rightItems[i];

    const leftChildren: Paragraph[] = [];
    const rightChildren: Paragraph[] = [];

    // Left column
    if (leftItem) {
      if (leftItem.category && leftItem.category !== lastLeftCategory) {
        leftChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: leftItem.category.toUpperCase(), bold: true, size: 16, color: "666666" }),
            ],
            spacing: { before: i === 0 ? 0 : 150, after: 50 },
          })
        );
        lastLeftCategory = leftItem.category;
      }
      leftChildren.push(
        new Paragraph({
          children: [new TextRun({ text: leftItem.term, bold: true, size: 18 })],
          spacing: { after: 20 },
        }),
        new Paragraph({
          children: [new TextRun({ text: leftItem.definition, size: 16 })],
          spacing: { after: leftItem.category === leftItems[i + 1]?.category ? 60 : 120 },
        })
      );
    } else {
      leftChildren.push(new Paragraph({ children: [] }));
    }

    // Right column
    if (rightItem) {
      if (rightItem.category && rightItem.category !== lastRightCategory) {
        rightChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: rightItem.category.toUpperCase(), bold: true, size: 16, color: "666666" }),
            ],
            spacing: { before: i === 0 ? 0 : 150, after: 50 },
          })
        );
        lastRightCategory = rightItem.category;
      }
      rightChildren.push(
        new Paragraph({
          children: [new TextRun({ text: rightItem.term, bold: true, size: 18 })],
          spacing: { after: 20 },
        }),
        new Paragraph({
          children: [new TextRun({ text: rightItem.definition, size: 16 })],
          spacing: { after: rightItem.category === rightItems[i + 1]?.category ? 60 : 120 },
        })
      );
    } else {
      rightChildren.push(new Paragraph({ children: [] }));
    }

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
            children: leftChildren,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              right: { style: BorderStyle.NONE },
            },
            children: rightChildren,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          column: { count: 1 },
        },
        children: [
          new Paragraph({
            text: title.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 300 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Generated by DeepTerm - ${new Date().toLocaleDateString()}`, 
                size: 14, 
                italics: true,
                color: "888888"
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^a-z0-9]/gi, "_")}.docx`);
}
