import { describe, expect, it } from 'bun:test'
import {
  buildReviewerTermInsert,
  expectedWrittenAnswer,
  promptLabelForFrontSide,
  shouldLogPomodoroSession,
} from '@/utils/reviewerTerms'

describe('reviewer term insert payload', () => {
  it('includes the required user_id so RLS insert policies succeed', () => {
    expect(buildReviewerTermInsert('user-1', 'cat-1', 'Mitosis', 'Cell division')).toEqual({
      user_id: 'user-1',
      category_id: 'cat-1',
      term: 'Mitosis',
      definition: 'Cell division',
    })
  })
})

describe('learn mode written answers', () => {
  const card = { term: 'stack', definition: 'LIFO collection' }

  it('asks for the term when the front side is the definition', () => {
    expect(expectedWrittenAnswer('definition', card)).toBe('stack')
    expect(promptLabelForFrontSide('definition')).toBe('Definition')
  })

  it('asks for the definition when the front side is the term', () => {
    expect(expectedWrittenAnswer('term', card)).toBe('LIFO collection')
    expect(promptLabelForFrontSide('term')).toBe('Term')
  })
})

describe('pomodoro session logging', () => {
  it('only logs work phases so breaks do not award XP', () => {
    expect(shouldLogPomodoroSession('work')).toBe(true)
    expect(shouldLogPomodoroSession('shortBreak')).toBe(false)
    expect(shouldLogPomodoroSession('longBreak')).toBe(false)
  })
})
