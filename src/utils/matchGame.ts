export function shuffleArray<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j]
    copy[j] = current
  }
  return copy
}

export function selectMatchPairs<T>(data: T[], pairCount = 6, random: () => number = Math.random): T[] {
  if (data.length <= pairCount) {
    return shuffleArray(data, random)
  }
  return shuffleArray(data, random).slice(0, pairCount)
}

export interface MatchCardInput {
  id: string
  term: string
  definition: string
}

export interface MatchCard {
  id: string
  content: string
  type: 'term' | 'definition'
  pairId: string
  isMatched: boolean
}

export function createGameCards(data: MatchCardInput[], pairCount = 6, random: () => number = Math.random): MatchCard[] {
  const selected = selectMatchPairs(data, pairCount, random)
  const gameCards: MatchCard[] = []

  selected.forEach((item) => {
    gameCards.push({
      id: `term-${item.id}`,
      content: item.term,
      type: 'term',
      pairId: item.id,
      isMatched: false,
    })
    gameCards.push({
      id: `def-${item.id}`,
      content: item.definition,
      type: 'definition',
      pairId: item.id,
      isMatched: false,
    })
  })

  return shuffleArray(gameCards, random)
}
