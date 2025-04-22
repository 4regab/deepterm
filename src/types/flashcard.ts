export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export type FlashcardDisplayMode = "term-first" | "definition-first";

export interface FlashcardDeck {
  id: string;
  title: string;
  dateCreated: string;
  lastModified: string;
  cards: Flashcard[];
  studyMaterial?: string;
  displayMode?: FlashcardDisplayMode; // Which side shows first: term or definition
}