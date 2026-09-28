import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { clientIp, isBot, jstDateKey, visitorHash } from '@/lib/visit-key';
import { recordVisit } from '@/lib/visits';

/**
 * 방문 기록(공개 페이지 비콘) — 항상 204(결과를 알려주지 않음).
 * 제외: 운영 배포가 아닌 환경(로컬·프리뷰가 운영 DB 를 오염시키지 않게), 봇, 어드민 본인, 다른 사이트에서 온 요청.
 */
export async function POST(req: NextRequest) {
  const skip = new NextResponse(null, { status: 204 });
  if (process.env.VERCEL_ENV !== 'production') return skip;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return skip;

  const ua = req.headers.get('user-agent') ?? '';
  if (isBot(ua)) return skip;

  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.nextUrl.host) return skip;

  if (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) return skip;

  try {
    const day = jstDateKey();
    await recordVisit(day, await visitorHash(secret, day, clientIp(req.headers), ua));
  } catch {
    // 집계 실패는 방문자 경험과 무관 — 조용히 무시
  }
  return skip;
}
