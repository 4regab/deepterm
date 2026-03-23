import { describe, expect, it } from 'bun:test'
import { getRequestOrigin } from '@/lib/requestOrigin'

describe('getRequestOrigin', () => {
  it('prefers forwarded host and protocol headers', () => {
    const request = new Request('http://0.0.0.0:3000/auth/callback', {
      headers: {
        host: '0.0.0.0:3000',
        'x-forwarded-host': 'deepterm.tech',
        'x-forwarded-proto': 'https',
      },
    })

    expect(getRequestOrigin(request)).toBe('https://deepterm.tech')
  })

  it('falls back to host when forwarded host is unavailable', () => {
    const request = new Request('http://127.0.0.1:3000/dashboard', {
      headers: {
        host: 'deepterm.tech',
      },
    })

    expect(getRequestOrigin(request)).toBe('http://deepterm.tech')
  })
})
