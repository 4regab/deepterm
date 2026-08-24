export const TRUSTED_PRODUCTION_ORIGINS = [
  'https://deepterm.tech',
  'https://www.deepterm.tech',
  'https://deepterm.app',
  'https://www.deepterm.app',
  'https://deepterm.vercel.app',
] as const

export const PRIMARY_ORIGIN = TRUSTED_PRODUCTION_ORIGINS[0]

export function isTrustedOrigin(origin: string, isDev = false): boolean {
  if ((TRUSTED_PRODUCTION_ORIGINS as readonly string[]).includes(origin)) {
    return true
  }
  return isDev && origin.startsWith('http://localhost')
}

export function getTrustedOrigin(requestOrigin: string, isDev = false): string {
  if (isTrustedOrigin(requestOrigin, isDev)) {
    return requestOrigin
  }
  return PRIMARY_ORIGIN
}
