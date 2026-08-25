import { describe, expect, it } from 'bun:test';
import { parseTextToCards } from '@/app/(dashboard)/materials/create/parseBulkText';

describe('parseTextToCards', () => {
  it('returns empty array for empty input', () => {
    expect(parseTextToCards('')).toEqual([]);
    expect(parseTextToCards('   \n\n  ')).toEqual([]);
  });

  it('parses standard space-hyphen-space format', () => {
    const input = 'Mitochondria - Powerhouse of the cell\nRibosome - Protein synthesis factory';
    const result = parseTextToCards(input);
    expect(result).toHaveLength(2);
    expect(result[0]?.term).toBe('Mitochondria');
    expect(result[0]?.definition).toBe('Powerhouse of the cell');
    expect(result[1]?.term).toBe('Ribosome');
    expect(result[1]?.definition).toBe('Protein synthesis factory');
  });

  it('correctly handles hyphenated terms without breaking on internal hyphens', () => {
    const input = [
      'Vitamin-A - Essential fat-soluble vitamin for vision',
      'COVID-19 : Infectious disease caused by SARS-CoV-2',
      'Self-esteem – Confidence in one\'s own worth or abilities',
      'T-Cell -> White blood cell involved in immune response',
      'E-commerce: Commercial transactions conducted electronically',
    ].join('\n');

    const result = parseTextToCards(input);
    expect(result).toHaveLength(5);
    expect(result[0]?.term).toBe('Vitamin-A');
    expect(result[0]?.definition).toBe('Essential fat-soluble vitamin for vision');

    expect(result[1]?.term).toBe('COVID-19');
    expect(result[1]?.definition).toBe('Infectious disease caused by SARS-CoV-2');

    expect(result[2]?.term).toBe('Self-esteem');
    expect(result[2]?.definition).toBe('Confidence in one\'s own worth or abilities');

    expect(result[3]?.term).toBe('T-Cell');
    expect(result[3]?.definition).toBe('White blood cell involved in immune response');

    expect(result[4]?.term).toBe('E-commerce');
    expect(result[4]?.definition).toBe('Commercial transactions conducted electronically');
  });

  it('supports tab separated values from spreadsheets', () => {
    const input = 'Term 1\tDefinition 1 with - dashes\nTerm 2\tDefinition 2: with colons';
    const result = parseTextToCards(input);
    expect(result).toHaveLength(2);
    expect(result[0]?.term).toBe('Term 1');
    expect(result[0]?.definition).toBe('Definition 1 with - dashes');
    expect(result[1]?.term).toBe('Term 2');
    expect(result[1]?.definition).toBe('Definition 2: with colons');
  });

  it('generates unique ids for each card', () => {
    const input = 'A - 1\nB - 2\nC - 3';
    const result = parseTextToCards(input);
    const ids = result.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
});
