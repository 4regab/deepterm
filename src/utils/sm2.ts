export interface SM2State {
  ease: number
  intervalDays: number
  repetitions: number
}

export interface SM2Result extends SM2State {
  dueAt: string
}

const MIN_EASE = 1.3

/** SM-2. Quality is 0–5 (0–2 fail, 3+ pass). */
export function reviewSM2(state: SM2State, quality: number, now: Date = new Date()): SM2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  let { ease, intervalDays, repetitions } = state

  if (q < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    if (repetitions === 0) {
      intervalDays = 1
    } else if (repetitions === 1) {
      intervalDays = 6
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * ease))
    }
    repetitions += 1
  }

  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  const due = new Date(now)
  due.setUTCDate(due.getUTCDate() + intervalDays)

  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays,
    repetitions,
    dueAt: due.toISOString(),
  }
}

export function qualityFromCorrect(correct: boolean): number {
  return correct ? 4 : 1
}
