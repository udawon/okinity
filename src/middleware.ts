import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { ADMIN_COOKIE, verifySession } from './lib/admin-auth';
import { crawlerOf, crawlerPath } from './lib/crawlers';
import { jstDateKey } from './lib/visit-key';

const intlMiddleware = createMiddleware(routing);

/**
 * AI·검색 크롤러 방문 기록(운영 전용) — 하루·봇·주소당 1행(crawler_visits, docs/supabase-geo-tracking.sql).
 * 응답을 기다리게 하지 않도록 waitUntil 로 뒤에서 보내고, 실패(표 없음 등)는 무시한다. 사람 방문은 기록하지 않는다.
 */
function recordCrawler(req: NextRequest, event: NextFetchEvent): void {
  if (process.env.VERCEL_ENV !== 'production') return;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const bot = crawlerOf(req.headers.get('user-agent') ?? '');
  if (!bot) return;
  event.waitUntil(
    fetch(`${url}/rest/v1/crawler_visits`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({ day: jstDateKey(), bot: bot.name, path: crawlerPath(req.nextUrl.pathname) })
    }).catch(() => {})
  );
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
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

  // 그 외에는 next-intl 다국어 미들웨어로 위임(공개 페이지 — 크롤러면 방문 기록).
  recordCrawler(req, event);
  return intlMiddleware(req);
}

export const config = {
  // api/_next/정적파일 제외한 모든 경로 + /admin
  matcher: ['/', '/(ko|en|ja)/:path*', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
