import { describe, expect, it } from 'bun:test'
import { getTrustedOrigin, isTrustedOrigin, PRIMARY_ORIGIN, TRUSTED_PRODUCTION_ORIGINS } from '@/lib/auth/trustedOrigins'
import { resolveAuthCallbackPath, sanitizeRedirectPath } from '@/lib/auth/redirect'

describe('trustedOrigins', () => {
  it('includes the canonical production domain from siteConfig', () => {
    expect(PRIMARY_ORIGIN).toBe('https://deepterm.app')
    expect(TRUSTED_PRODUCTION_ORIGINS).toContain('https://deepterm.app')
    expect(TRUSTED_PRODUCTION_ORIGINS).toContain('https://www.deepterm.app')
    expect(TRUSTED_PRODUCTION_ORIGINS).not.toContain('https://deepterm.tech')
    expect(TRUSTED_PRODUCTION_ORIGINS).not.toContain('https://deepterm.vercel.app')
  })

  it('accepts known production origins and localhost in development', () => {
    expect(isTrustedOrigin('https://deepterm.app')).toBe(true)
    expect(isTrustedOrigin('https://deepterm.tech')).toBe(false)
    expect(isTrustedOrigin('https://evil.example')).toBe(false)
    expect(isTrustedOrigin('http://localhost:3000', true)).toBe(true)
    expect(isTrustedOrigin('http://localhost:3000', false)).toBe(false)
  })

  it('falls back to the canonical origin instead of an untrusted Host header', () => {
    expect(getTrustedOrigin('https://evil.example')).toBe('https://deepterm.app')
    expect(getTrustedOrigin('https://deepterm.app')).toBe('https://deepterm.app')
  })
})

describe('auth callback redirects', () => {
  it('blocks open redirects', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/materials')).toBe('/materials')
  })

  it('blocks backslash and encoded-backslash open redirects', () => {
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/%5Cevil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/%5cevil.com')).toBe('/dashboard')
  })

  it('rejects paths outside the app allowlist', () => {
    expect(sanitizeRedirectPath('/evil')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/admin')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/materials/../evil')).toBe('/dashboard')
  })

  it('sends visitors home when no OAuth code is present', () => {
    expect(resolveAuthCallbackPath({ hasCode: false, returnTo: '/dashboard' })).toBe('/')
    expect(resolveAuthCallbackPath({ hasCode: false })).toBe('/')
  })

  it('sends visitors home when code exchange fails', () => {
    expect(resolveAuthCallbackPath({ hasCode: true, exchangeFailed: true, returnTo: '/materials' })).toBe('/')
  })

  it('honors a safe returnTo only after a successful code exchange', () => {
    expect(resolveAuthCallbackPath({ hasCode: true, returnTo: '/materials' })).toBe('/materials')
    expect(resolveAuthCallbackPath({ hasCode: true, returnTo: null })).toBe('/dashboard')
  })
})
