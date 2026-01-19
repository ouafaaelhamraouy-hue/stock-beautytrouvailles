import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Extract locale and pathname
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1] || 'en';
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.includes(route)
  );
  
  // Skip auth check for API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return intlMiddleware(request);
  }
  
  // Apply locale routing first
  let response = intlMiddleware(request);
  
  // Check authentication for protected routes
  if (!isPublicRoute) {
    try {
      const supabase = createClient(request, response);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      // If not authenticated and trying to access protected route, redirect to login
      if (!user) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // If authenticated and trying to access login, redirect to dashboard
      if (user && pathname.includes('/login')) {
        const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    } catch (error) {
      // If there's an error checking auth, allow through (will be handled by page)
      console.error('Auth check error:', error);
    }
  }
  
  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(fr|en)/:path*'],
};
