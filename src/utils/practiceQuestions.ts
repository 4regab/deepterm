export type QuestionType = 'multipleChoice' | 'trueFalse' | 'fillBlank'

export interface PracticeCard {
  id: string
  term: string
  definition: string
}

export interface PracticeQuestion {
  id: string
  type: QuestionType
  question: string
  correctAnswer: string
  options?: string[]
  tfDisplayedTerm?: string
  tfIsCorrectPairing?: boolean
  userAnswer?: string
  isCorrect?: boolean
}

export function buildFillBlankPrompt(definition: string): string {
  return definition.trim()
}

export function gradePracticeAnswer(
  type: QuestionType,
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const answer = userAnswer.toLowerCase().trim()
  const expected = correctAnswer.toLowerCase().trim()
  return answer === expected
}

export function generateQuestionsFromCards(
  cards: PracticeCard[],
  types: QuestionType[],
  cardCount: number,
  random: () => number = Math.random,
): PracticeQuestion[] {
  const questions: PracticeQuestion[] = []
  const shuffled = [...cards].sort(() => random() - 0.5)
  const selectedCards = shuffled.slice(0, cardCount)
  const enabledTypes = types.length > 0 ? types : ['multipleChoice']

  selectedCards.forEach((card, idx) => {
    const type = enabledTypes[idx % enabledTypes.length]

    if (type === 'trueFalse') {
      const isCorrectPairing = random() > 0.5
      const others = cards.filter((c) => c.id !== card.id)
      const displayedTerm = isCorrectPairing || others.length === 0
        ? card.term
        : others[Math.floor(random() * others.length)].term

      questions.push({
        id: card.id,
        type,
        question: card.definition,
        correctAnswer: isCorrectPairing ? 'true' : 'false',
        tfDisplayedTerm: displayedTerm,
        tfIsCorrectPairing: isCorrectPairing,
      })
      return
    }

    if (type === 'fillBlank') {
      questions.push({
        id: card.id,
        type,
        question: buildFillBlankPrompt(card.definition),
        correctAnswer: card.term,
      })
      return
    }

    const others = cards.filter((c) => c.id !== card.id).map((c) => c.term)
    const wrongOptions = others.sort(() => random() - 0.5).slice(0, 3)
    questions.push({
      id: card.id,
      type: 'multipleChoice',
      question: card.definition,
      correctAnswer: card.term,
      options: [...wrongOptions, card.term].sort(() => random() - 0.5),
    })
  })

  return questions
}
