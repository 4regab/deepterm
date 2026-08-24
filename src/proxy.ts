import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Allowed origins for CORS (SECURITY FIX - CWE-942)
const ALLOWED_ORIGINS = [
  'https://deepterm.app',
  'https://www.deepterm.app',
  'https://deepterm.vercel.app',
  // Development origins are handled separately below
]

// Only allow 'unsafe-eval' in development (needed for Next.js HMR/React DevTools)
const IS_DEV = process.env.NODE_ENV === 'development'

function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://us-assets.i.posthog.com https://*.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://generativelanguage.googleapis.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://us.i.posthog.com https://*.posthog.com https://*.supabase.co",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/materials',
  '/pomodoro',
  '/practice',
  '/reviewer',
  '/account',
  '/achievements',
  '/api/generate-cards',
  '/api/generate-reviewer',
  '/api/share',
]

// Public routes that bypass auth check entirely
const PUBLIC_ROUTES = [
  '/share',
]

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Generate a per-request CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Pass nonce to server components via request header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // Create response to modify
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set CSP with nonce (replaces static unsafe-inline from next.config.ts)
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))

  // CORS: Only allow trusted origins (SECURITY FIX)
  if (origin) {
    const isDev = process.env.NODE_ENV === 'development'
    const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
      (isDev && origin.startsWith('http://localhost'))

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies for downstream handlers
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Create new response with updated request headers
          const newResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          // Re-apply CSP with nonce on the new response
          newResponse.headers.set('Content-Security-Policy', buildCspHeader(nonce))
          // Set cookies on response
          cookiesToSet.forEach(({ name, value, options }) =>
            newResponse.cookies.set(name, value, options)
          )
          response = newResponse
        },
      },
    }
  )

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser()

  // Enforce soft-delete lockout: if the profile is marked for deletion, the user
  // cannot access the app EXCEPT the /account page where they can cancel.
  // The cancel path must stay open during the 30-day grace window.
  // Home page is included so a deletion-pending user can always land somewhere.
  const DELETION_ALLOWED_EXACT = new Set(['/', '/auth'])
  const DELETION_ALLOWED_PREFIXES = ['/account', '/auth/']
  const isDeletionAllowed =
    DELETION_ALLOWED_EXACT.has(pathname) ||
    DELETION_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (user && !isDeletionAllowed) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profileRow?.deleted_at) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Account is scheduled for deletion. Visit /account to cancel.' },
          { status: 403 }
        )
      }
      const redirectUrl = new URL('/account?deletion_pending=1', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if route is public (no auth needed)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // Allow public routes without any auth check
  if (isPublicRoute) {
    return response
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // Check if route is auth route
  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    // For pages, redirect to home
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
