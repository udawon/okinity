import { type NextRequest } from 'next/server';

/**
 * 미디어 프록시 — Supabase Storage 공개 객체를 자사 도메인(/cdn/*)으로 중계하며
 * 장기 immutable 캐시 헤더를 강제한다.
 *
 * 이유: Supabase 공개 URL이 cacheControl 설정과 무관하게 `cache-control: no-cache`를 내려
 * 재방문마다 재검증(왕복)이 발생하고 CDN 엣지 캐시도 안 됨(cf-cache-status: DYNAMIC).
 * 업로드 파일명이 불변(타임스탬프-랜덤)이라, 여기서 immutable 캐시를 입혀
 * 브라우저는 무재검증 캐시, Vercel 엣지는 응답을 캐시 → 재방문 0요청·빠른 로드.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const base = process.env.SUPABASE_URL;
  if (!base || !path?.length) return new Response('Not found', { status: 404 });

  const objectPath = path.map(encodeURIComponent).join('/');
  const upstream = await fetch(`${base}/storage/v1/object/public/${objectPath}`);
  if (!upstream.ok || !upstream.body) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'application/octet-stream'
  );
  // 파일명 불변 → 1년 immutable. 브라우저·Vercel 엣지 모두 캐시.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(upstream.body, { status: 200, headers });
}
