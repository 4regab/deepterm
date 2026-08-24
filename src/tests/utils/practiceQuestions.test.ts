import { describe, expect, it } from 'bun:test'
import {
  buildFillBlankPrompt,
  generateQuestionsFromCards,
  gradePracticeAnswer,
} from '@/utils/practiceQuestions'

const cards = [
  { id: '1', term: 'binary search tree', definition: 'A tree data structure with ordered children' },
  { id: '2', term: 'stack', definition: 'Last in first out collection' },
  { id: '3', term: 'queue', definition: 'First in first out collection' },
  { id: '4', term: 'heap', definition: 'A complete binary tree used for priority' },
]

describe('practiceQuestions', () => {
  it('uses the full definition as the fill-in-the-blank prompt', () => {
    expect(buildFillBlankPrompt(cards[0].definition)).toBe(cards[0].definition)
    expect(buildFillBlankPrompt(cards[0].definition)).not.toContain('_____')
  })

  it('grades fill-in-the-blank by exact term match, not first-word includes', () => {
    expect(gradePracticeAnswer('fillBlank', 'binary search tree', 'binary search tree')).toBe(true)
    expect(gradePracticeAnswer('fillBlank', 'BINARY SEARCH TREE', 'binary search tree')).toBe(true)
    expect(gradePracticeAnswer('fillBlank', 'binary', 'binary search tree')).toBe(false)
    expect(gradePracticeAnswer('fillBlank', 'I think binary is close', 'binary search tree')).toBe(false)
  })

  it('grades multiple choice and true/false with trimmed case-insensitive equality', () => {
    expect(gradePracticeAnswer('multipleChoice', ' Stack ', 'stack')).toBe(true)
    expect(gradePracticeAnswer('trueFalse', 'TRUE', 'true')).toBe(true)
    expect(gradePracticeAnswer('trueFalse', 'false', 'true')).toBe(false)
  })

  it('builds fill-blank questions with the definition as the prompt and the term as the answer', () => {
    const questions = generateQuestionsFromCards(cards, ['fillBlank'], 2, () => 0.1)
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.type === 'fillBlank')).toBe(true)
    expect(questions.every((q) => !q.question.includes('_____'))).toBe(true)
    expect(cards.map((c) => c.term)).toContain(questions[0].correctAnswer)
  })
})
