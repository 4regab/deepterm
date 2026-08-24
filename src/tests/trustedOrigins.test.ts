import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'
import {
  CANONICAL_ORIGIN,
  getTrustedOrigin,
  isTrustedOrigin,
} from '@/lib/auth/trustedOrigins'
import { forbiddenUnlessSameOrigin } from '@/lib/auth/assertSameOrigin'

describe('trustedOrigins', () => {
  it('allows the production domain only', () => {
    expect(isTrustedOrigin('https://deepterm.app')).toBe(true)
    expect(isTrustedOrigin('https://www.deepterm.app')).toBe(true)
  })

  it('rejects every other host, including old preview URLs', () => {
    expect(isTrustedOrigin('https://deepterm.tech')).toBe(false)
    expect(isTrustedOrigin('https://www.deepterm.tech')).toBe(false)
    expect(isTrustedOrigin('https://deepterm.vercel.app')).toBe(false)
    expect(isTrustedOrigin('https://evil.example')).toBe(false)
    expect(isTrustedOrigin('https://deepterm.app.evil.com')).toBe(false)
    expect(isTrustedOrigin(null)).toBe(false)
  })

  it('never reflects an untrusted request host for redirects', () => {
    expect(getTrustedOrigin(new URL('https://evil.example/auth/callback'))).toBe(
      CANONICAL_ORIGIN,
    )
    expect(getTrustedOrigin(new URL('https://deepterm.app/auth/callback'))).toBe(
      'https://deepterm.app',
    )
  })
})

describe('forbiddenUnlessSameOrigin', () => {
  it('allows a trusted Origin', () => {
    const request = new NextRequest('https://deepterm.app/api/share', {
      method: 'POST',
      headers: { origin: 'https://deepterm.app' },
    })
    expect(forbiddenUnlessSameOrigin(request)).toBeNull()
  })

  it('rejects a cross-site Origin', async () => {
    const request = new NextRequest('https://deepterm.app/api/share', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    const response = forbiddenUnlessSameOrigin(request)
    expect(response?.status).toBe(403)
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('falls back to a trusted Referer when Origin is absent', () => {
    const request = new NextRequest('https://deepterm.app/api/share', {
      method: 'POST',
      headers: { referer: 'https://deepterm.app/materials' },
    })
    expect(forbiddenUnlessSameOrigin(request)).toBeNull()
  })
})
