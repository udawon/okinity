import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { ADMIN_COOKIE, verifySession } from './lib/admin-auth';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin 은 다국어 라우팅을 타지 않고, 세션 쿠키로 보호한다.
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const ok = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 그 외에는 next-intl 다국어 미들웨어로 위임.
  return intlMiddleware(req);
}

export const config = {
  // api/_next/정적파일 제외한 모든 경로 + /admin
  matcher: ['/', '/(ko|en|ja)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
