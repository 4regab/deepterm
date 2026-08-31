import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

/**
 * Unit tests for the account-deletion server actions.
 *
 * The actions are pure orchestration over Supabase SSR + an RPC call, so we
 * mock out @/lib/auth/session and @/config/supabase/server and exercise the
 * decision tree (phrase mismatch / not authenticated / rate-limited / happy
 * path / cancel) directly.
 */

const REQUIRED_PHRASE = 'delete my account'

const mockSession = { user: null as null | { id: string; email?: string } }
let rpcImpl: (name: string, args: unknown) => Promise<{ data: unknown; error: unknown }>
let signOutCalls = 0

const supabase = {
  rpc: mock(async (name: string, args: unknown) => rpcImpl(name, args)),
  auth: {
    signOut: mock(async () => {
      signOutCalls += 1
      return { error: null }
    }),
  },
}

mock.module('@/lib/auth/session', () => ({
  getSession: mock(async () => mockSession),
}))

mock.module('@/config/supabase/server', () => ({
  createServerSupabaseClient: mock(async () => supabase),
}))

mock.module('next/headers', () => ({
  headers: mock(async () => new Headers({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'curl/8' })),
}))

mock.module('@/lib/auth/requestIdentity', () => ({
  hashRequestIdentity: () => 'hash',
  hashValue: (v: string) => `h:${v}`,
  extractClientIp: () => '1.2.3.4',
  extractUserAgent: () => 'curl/8',
  resolveRequestHashPepper: () => 'test-pepper-at-least-16',
}))

// Import AFTER mocks are registered.
const actions = await import('../app/(dashboard)/account/actions')

describe('account deletion server actions', () => {
  beforeEach(() => {
    mockSession.user = { id: 'user-1', email: 't@example.com' }
    signOutCalls = 0
    supabase.rpc.mockClear()
    supabase.auth.signOut.mockClear()
    rpcImpl = async () => ({
      data: { status: 'scheduled', deleted_at: '2025-01-01T00:00:00Z', finalize_at: '2025-01-31T00:00:00Z' },
      error: null,
    })
  })

  afterEach(() => {
    mockSession.user = null
  })

  describe('requestAccountDeletionAction', () => {
    it('rejects when the confirmation phrase does not match exactly', async () => {
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: 'DELETE MY ACCOUNT' })
      expect(res.ok).toBe(false)
      expect(res.error).toBe('phrase_mismatch')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('rejects when the confirmation phrase is empty', async () => {
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: '' })
      expect(res.ok).toBe(false)
      expect(res.error).toBe('phrase_mismatch')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('rejects a confirmation phrase longer than 128 chars (schema guard)', async () => {
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: 'x'.repeat(200) })
      expect(res.ok).toBe(false)
      expect(res.error).toBe('invalid_input')
    })

    it('rejects when the user is not authenticated', async () => {
      mockSession.user = null
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: REQUIRED_PHRASE })
      expect(res.ok).toBe(false)
      expect(res.error).toBe('not_authenticated')
      expect(supabase.rpc).not.toHaveBeenCalled()
    })

    it('maps the DB rate-limit error code to rate_limited', async () => {
      rpcImpl = async () => ({ data: null, error: { code: '54000', message: 'deletion_rate_limited' } })
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: REQUIRED_PHRASE })
      expect(res.ok).toBe(false)
      expect(res.error).toBe('rate_limited')
    })

    it('signs out and returns schedule metadata on success', async () => {
      const res = await actions.requestAccountDeletionAction({ confirmationPhrase: REQUIRED_PHRASE })
      expect(res.ok).toBe(true)
      expect(res.status).toBe('scheduled')
      expect(res.deletedAt).toBe('2025-01-01T00:00:00Z')
      expect(res.finalizeAt).toBe('2025-01-31T00:00:00Z')
      expect(signOutCalls).toBe(1)
    })

    it('passes both hashes to the RPC', async () => {
      let captured: unknown = null
      rpcImpl = async (_name, args) => {
        captured = args
        return { data: { status: 'scheduled', deleted_at: 't1', finalize_at: 't2' }, error: null }
      }
      await actions.requestAccountDeletionAction({ confirmationPhrase: REQUIRED_PHRASE })
      expect(captured).toEqual({
        p_confirmation_phrase: REQUIRED_PHRASE,
        p_ip_hash: 'h:1.2.3.4',
        p_user_agent_hash: 'h:curl/8',
      })
    })
  })

  describe('cancelAccountDeletionAction', () => {
    it('returns not_authenticated when no session', async () => {
      mockSession.user = null
      const res = await actions.cancelAccountDeletionAction()
      expect(res.ok).toBe(false)
      expect(res.error).toBe('not_authenticated')
    })

    it('returns cancelled on happy path', async () => {
      rpcImpl = async () => ({ data: { status: 'cancelled' }, error: null })
      const res = await actions.cancelAccountDeletionAction()
      expect(res.ok).toBe(true)
      expect(res.status).toBe('cancelled')
    })

    it('surfaces rpc_failed on DB error', async () => {
      rpcImpl = async () => ({ data: null, error: { message: 'boom' } })
      const res = await actions.cancelAccountDeletionAction()
      expect(res.ok).toBe(false)
      expect(res.error).toBe('rpc_failed')
    })
  })

  describe('getAccountDeletionStatusAction', () => {
    it('returns { pending: false } when not authenticated', async () => {
      mockSession.user = null
      const res = await actions.getAccountDeletionStatusAction()
      expect(res).toEqual({ pending: false })
    })

    it('returns pending metadata when the RPC reports pending', async () => {
      rpcImpl = async () => ({
        data: { pending: true, deleted_at: 'x', finalize_at: 'y' },
        error: null,
      })
      const res = await actions.getAccountDeletionStatusAction()
      expect(res).toEqual({ pending: true, deletedAt: 'x', finalizeAt: 'y' })
    })

    it('returns pending=false when the RPC reports non-pending', async () => {
      rpcImpl = async () => ({ data: { pending: false }, error: null })
      const res = await actions.getAccountDeletionStatusAction()
      expect(res).toEqual({ pending: false, deletedAt: undefined, finalizeAt: undefined })
    })
  })
})
