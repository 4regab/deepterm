/** Declared Vercel maxDuration for generate routes (seconds). */
export const GENERATION_MAX_DURATION_SECONDS = 90

/** Server-side AbortSignal budget; must stay under maxDuration. */
export const GENERATION_TIMEOUT_MS = 85_000

/** Browser fetch abort; slightly above server budget, within maxDuration. */
export const CLIENT_GENERATION_TIMEOUT_MS = 90_000

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))) {
    return true
  }
  return false
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return
  const error = new Error('Generation aborted')
  error.name = 'AbortError'
  throw error
}

export function mergeAbortSignals(...signals: Array<AbortSignal | undefined>): AbortSignal | undefined {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal))
  if (active.length === 0) return undefined
  if (active.length === 1) return active[0]
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(active)
  }
  const controller = new AbortController()
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

export const combineAbortSignals = mergeAbortSignals

export async function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal)
  if (!signal) return promise

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      const error = new Error('Generation aborted')
      error.name = 'AbortError'
      reject(error)
    }
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}
