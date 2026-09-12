import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for auth, static assets, and API docs
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/api-docs')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes (skip in development/test to avoid issues)
  if (pathname.startsWith('/api') && process.env.NODE_ENV === 'production') {
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const key = `api:${ip}`;

    const entry = rateLimit.get(key);
    if (!entry || now > entry.reset) {
      rateLimit.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    } else {
      if (entry.count >= RATE_LIMIT_MAX) {
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
              'X-RateLimit-Remaining': '0',
              'Retry-After': '60',
            },
          }
        );
      }
      entry.count++;
    }
  }

  // Redirect unauthenticated users away from protected pages
  if (
    pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/register')
  ) {
    // Auth is checked at the route handler level, so we don't block here
    // This middleware focuses on rate limiting and could add other security headers
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy — restrict to same-origin with safe fallbacks
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.sentry.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' wss: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );

  // HSTS only in production (prevents issues with self-signed certs in dev)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
