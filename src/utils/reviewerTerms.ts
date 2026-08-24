export function buildReviewerTermInsert(
  userId: string,
  categoryId: string,
  term: string,
  definition: string,
) {
  return {
    user_id: userId,
    category_id: categoryId,
    term,
    definition,
  }
}

export function shouldLogPomodoroSession(phase: 'work' | 'shortBreak' | 'longBreak'): boolean {
  return phase === 'work'
}

export function expectedWrittenAnswer(
  frontSide: 'term' | 'definition',
  card: { term: string; definition: string },
): string {
  return frontSide === 'definition' ? card.term : card.definition
}

export function promptLabelForFrontSide(frontSide: 'term' | 'definition'): 'Term' | 'Definition' {
  return frontSide === 'definition' ? 'Definition' : 'Term'
}
