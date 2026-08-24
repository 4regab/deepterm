import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'
import {
  CANONICAL_ORIGIN,
  getTrustedOrigin,
  isTrustedOrigin,
} from '@/lib/auth/trustedOrigins'
import { forbiddenUnlessSameOrigin } from '@/lib/auth/assertSameOrigin'

describe('trustedOrigins', () => {
  it('allows the canonical production origin', () => {
    expect(isTrustedOrigin('https://deepterm.tech')).toBe(true)
    expect(isTrustedOrigin('https://www.deepterm.tech')).toBe(true)
  })

  it('allows legacy and preview origins', () => {
    expect(isTrustedOrigin('https://deepterm.app')).toBe(true)
    expect(isTrustedOrigin('https://deepterm.vercel.app')).toBe(true)
  })

  it('rejects unknown and protocol-relative origins', () => {
    expect(isTrustedOrigin('https://evil.example')).toBe(false)
    expect(isTrustedOrigin('https://deepterm.tech.evil.com')).toBe(false)
    expect(isTrustedOrigin(null)).toBe(false)
  })

  it('never reflects an untrusted request host for redirects', () => {
    expect(getTrustedOrigin(new URL('https://evil.example/auth/callback'))).toBe(
      CANONICAL_ORIGIN,
    )
    expect(getTrustedOrigin(new URL('https://deepterm.tech/auth/callback'))).toBe(
      'https://deepterm.tech',
    )
  })
})

describe('forbiddenUnlessSameOrigin', () => {
  it('allows a trusted Origin', () => {
    const request = new NextRequest('https://deepterm.tech/api/share', {
      method: 'POST',
      headers: { origin: 'https://deepterm.tech' },
    })
    expect(forbiddenUnlessSameOrigin(request)).toBeNull()
  })

  it('rejects a cross-site Origin', async () => {
    const request = new NextRequest('https://deepterm.tech/api/share', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })
    const response = forbiddenUnlessSameOrigin(request)
    expect(response?.status).toBe(403)
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('falls back to a trusted Referer when Origin is absent', () => {
    const request = new NextRequest('https://deepterm.tech/api/share', {
      method: 'POST',
      headers: { referer: 'https://deepterm.tech/materials' },
    })
    expect(forbiddenUnlessSameOrigin(request)).toBeNull()
  })
})
