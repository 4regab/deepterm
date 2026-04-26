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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ''} https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com https://us-assets.i.posthog.com https://*.posthog.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://generativelanguage.googleapis.com https://hcaptcha.com https://*.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://us.i.posthog.com https://*.posthog.com",
    "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com",
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

  const storageKey = (() => {
    const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
    return `sb-${projectRef}-auth-token`
  })()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { name: storageKey },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          // Re-apply CSP with nonce on the new response
          response.headers.set('Content-Security-Policy', buildCspHeader(nonce))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser()

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
