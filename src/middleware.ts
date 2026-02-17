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
    '/auth/verify-email',
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

  // CSRF: Set CSRF cookie on page loads (not API routes)
  const response = NextResponse.next();

  // Set CSP header
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // Set CSRF cookie on page loads
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    const existingCsrf = request.cookies.get('__csrf');
    if (!existingCsrf) {
      const csrfToken = crypto.randomUUID();
      response.cookies.set('__csrf', csrfToken, {
        httpOnly: false, // Must be readable by JS for double-submit
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }
  }

  // Allow public routes
  if (isPublicRoute) {
    return response;
  }

  // Admin routes require admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), request.url));
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

    return response;
  }

  // Protected user routes
  const protectedRoutes = ['/dashboard', '/cart', '/checkout', '/orders', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), request.url));
    }

    // Admin users should use admin panel, not user dashboard
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (adminRoles.includes(token.role as string) && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return response;
  }

  return response;
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
