import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/products',
    '/auth/signin',
    '/auth/signup',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/shipping',
    '/returns',
    '/compliance',
    '/gsa',
  ];

  // Check if it's a public route or starts with public paths
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/products/')
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + pathname, request.url));
    }

    const adminRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'ACCOUNTANT',
      'CUSTOMER_SERVICE',
      'WAREHOUSE_MANAGER',
      'MARKETING_MANAGER',
      'CONTENT_MANAGER',
    ];

    if (!adminRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // Protected user routes
  const protectedRoutes = ['/dashboard', '/cart', '/checkout', '/orders', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + pathname, request.url));
    }

    // Admin users should use admin panel, not user dashboard
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (adminRoles.includes(token.role as string) && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
