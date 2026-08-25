export type WizardStep = 'source' | 'configure' | 'review';

export type SourceMethod = 'file' | 'text' | 'manual';

export type MaterialTargetType = 'material' | 'reviewer';

export type ExtractionMode = 'full' | 'sentence' | 'keywords';

export interface FlashcardDraftItem {
  id: string;
  term: string;
  definition: string;
  provenance?: string;
}

export interface ReviewerTermDraft {
  id: string;
  term: string;
  definition: string;
  examples?: string[];
  keywords?: string[];
  subcategoryTitle?: string;
  subcategories?: string[];
}

export interface ReviewerCategoryDraft {
  id: string;
  name: string;
  color: string;
  terms: ReviewerTermDraft[];
}

export interface StoredDraft {
  wizardStep: WizardStep;
  sourceMethod: SourceMethod;
  pastedText: string;
  fileName?: string | null;
  fileSize?: number | null;
  targetType: MaterialTargetType;
  extractionMode: ExtractionMode;
  title: string;
  folderId: string | null;
  cards: FlashcardDraftItem[];
  reviewerCategories: ReviewerCategoryDraft[];
  generatedFrom?: string | null;
}
