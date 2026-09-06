import { fisherYatesShuffle } from './shuffle'

export function selectMatchPairs<T>(data: T[], pairCount = 6, random: () => number = Math.random): T[] {
  if (data.length <= pairCount) {
    return fisherYatesShuffle(data, random)
  }
  return fisherYatesShuffle(data, random).slice(0, pairCount)
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

  return fisherYatesShuffle(gameCards, random)
}
