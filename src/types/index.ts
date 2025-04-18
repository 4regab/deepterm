
export interface KeyTerm {
  term: string;
  meaning: string;
  category?: string;
  subcategoryTitle?: string;
  subcategories?: string[];
  examples?: string[];
  keywords?: string[];
}

export type ExtractionMode = "full" | "sentence" | "keywords" | null;

export interface ExtractionResult {
  title: string;
  keyTerms: KeyTerm[];
  timestamp?: string;
  extractionMode?: ExtractionMode;
}
