import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/onboarding',
  '/book',       // Booking engine (public)
  '/w',          // Website (public)
  '/l',          // Landing pages (public)
  '/precheckin', // Pre check-in (public)
  '/api',        // API routes handle their own auth
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without any auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth session cookie (sb-*-auth-token)
  const hasSupabaseCookie = Array.from(request.cookies.getAll()).some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  // Check for local demo session marker
  const hasDemoSession = request.cookies.get('hotelflow_demo_session')?.value === 'true';

  // If neither auth mechanism is present, redirect to login
  if (!hasSupabaseCookie && !hasDemoSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
