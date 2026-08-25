import type { FlashcardDraftItem } from './types';

/**
 * High-priority multi-character or whitespace-padded separators.
 * Spaced separators must take precedence over bare single characters so that
 * intra-word hyphens (e.g. "Vitamin-A", "COVID-19", "Self-esteem") are preserved.
 */
const HIGH_PRIORITY_SEPARATORS = [
  '\t',
  ' - ',
  ' : ',
  ' ; ',
  ' – ',
  ' — ',
  '::',
  '-->',
  '->',
  ' => ',
  ' | ',
] as const;

const SECONDARY_SEPARATORS = [
  ' : ',
  ': ',
  ' ;',
  '; ',
  ' –',
  '– ',
  ' —',
  '— ',
  ' -',
  '- ',
] as const;

const FALLBACK_SINGLE_CHAR = [
  ':',
  ';',
  '–',
  '—',
] as const;

export function generateItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseTextToCards(text: string): FlashcardDraftItem[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cards: FlashcardDraftItem[] = [];

  for (const line of lines) {
    let term = '';
    let definition = '';

    // Pass 1: Try high priority spaced / multi-char separators
    for (const sep of HIGH_PRIORITY_SEPARATORS) {
      const idx = line.indexOf(sep);
      if (idx > 0) {
        term = line.substring(0, idx).trim();
        definition = line.substring(idx + sep.length).trim();
        break;
      }
    }

    // Pass 2: Try secondary separators with partial spacing
    if (!term || !definition) {
      for (const sep of SECONDARY_SEPARATORS) {
        const idx = line.indexOf(sep);
        if (idx > 0) {
          term = line.substring(0, idx).trim();
          definition = line.substring(idx + sep.length).trim();
          break;
        }
      }
    }

    // Pass 3: Fallback single-character delimiters (excluding bare hyphen)
    if (!term || !definition) {
      for (const sep of FALLBACK_SINGLE_CHAR) {
        const idx = line.indexOf(sep);
        if (idx > 0) {
          term = line.substring(0, idx).trim();
          definition = line.substring(idx + sep.length).trim();
          break;
        }
      }
    }

    if (term && definition) {
      cards.push({
        id: generateItemId(),
        term,
        definition,
      });
    }
  }

  return cards;
}
