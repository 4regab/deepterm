
export interface KeyTerm {
  term: string;
  meaning: string;
  category?: string;
  subcategoryTitle?: string;
  subcategories?: string[];
  examples?: string[];
  keywords?: string[];
}

export interface ExtractionResult {
  title: string;
  keyTerms: KeyTerm[];
  timestamp?: string;
  extractionMode?: "full" | "sentence" | "keywords";
}
