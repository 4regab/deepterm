import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Allowed origins for CORS (SECURITY FIX - CWE-942)
const ALLOWED_ORIGINS = [
  'https://deepterm.tech',
  'https://www.deepterm.tech',
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/materials',
  '/pomodoro',
  '/practice',
  '/reviewer',
  '/account',
  '/api/generate-cards',
  '/api/generate-reviewer',
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

  // Create response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // CORS: Only allow trusted origins (SECURITY FIX)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
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
