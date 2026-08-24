import { fisherYatesShuffle } from '@/utils/shuffle'

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
  const trimmed = definition.trim()
  if (!trimmed) return '_____'
  return `_____ \n\n${trimmed}`
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
  const shuffled = fisherYatesShuffle(cards, random)
  const selectedCards = shuffled.slice(0, Math.max(0, cardCount))
  const enabledTypes: QuestionType[] = types.length > 0 ? types : ['multipleChoice']

  selectedCards.forEach((card, idx) => {
    const type = enabledTypes[idx % enabledTypes.length]

    if (type === 'trueFalse') {
      const others = cards.filter((c) => c.id !== card.id)
      const canSpoof = others.length > 0
      const isCorrectPairing = canSpoof ? random() > 0.5 : true
      const displayedTerm = isCorrectPairing
        ? card.term
        : others[Math.floor(random() * others.length)]!.term

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
    const wrongOptions = fisherYatesShuffle(others, random).slice(0, 3)
    questions.push({
      id: card.id,
      type: 'multipleChoice',
      question: card.definition,
      correctAnswer: card.term,
      options: fisherYatesShuffle([...wrongOptions, card.term], random),
    })
  })

  return questions
}
