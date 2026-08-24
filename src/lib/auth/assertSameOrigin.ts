import { NextResponse } from 'next/server'
import { isTrustedOrigin } from './trustedOrigins'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

function forbidden(): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403, headers: NO_STORE },
  )
}

/**
 * CSRF defense for cookie-authenticated Route Handlers.
 * Server Actions already compare Origin to Host; Route Handlers do not.
 */
export function forbiddenUnlessSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  if (origin) {
    return isTrustedOrigin(origin) ? null : forbidden()
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      if (isTrustedOrigin(new URL(referer).origin)) return null
    } catch {
      return forbidden()
    }
    return forbidden()
  }

  if (process.env.NODE_ENV === 'production') {
    return forbidden()
  }
  return null
}

export function jsonNoStore(
  body: unknown,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: NO_STORE,
  })
}
