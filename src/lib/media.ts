/**
 * Supabase Storage 공개 미디어 URL을 자사 프록시 경로(/cdn/*)로 바꾼다.
 * /cdn 라우트 핸들러가 immutable 캐시를 입혀 재방문 0요청·엣지 캐시를 가능케 한다.
 * 로컬 경로(/images/...)나 비-Supabase URL은 그대로 둔다(순수 함수, 서버/클라 공용).
 */
const SUPABASE_PUBLIC = /\/storage\/v1\/object\/public\/(.+)$/;

export function cdnMedia(url: string | undefined | null): string {
  if (!url) return url ?? '';
  const m = url.match(SUPABASE_PUBLIC);
  return m ? `/cdn/${m[1]}` : url;
}
