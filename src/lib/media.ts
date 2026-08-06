/**
 * Supabase Storage 공개 미디어 URL을 자사 프록시 경로(/cdn/*)로 바꾼다.
 * /cdn 라우트 핸들러가 immutable 캐시를 입혀 재방문 0요청·엣지 캐시를 가능케 한다.
 * 로컬 경로(/images/...)나 비-Supabase URL은 그대로 둔다(순수 함수, 서버/클라 공용).
 */
const SUPABASE_PUBLIC = /\/storage\/v1\/object\/public\/(.+)$/;

/** 영상 확장자 판별 — 확장자는 업로드 시 원본에서 보존된다. */
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export function isVideoUrl(url: string | undefined | null): boolean {
  return VIDEO_EXT.test(url ?? '');
}

export function cdnMedia(url: string | undefined | null): string {
  if (!url) return url ?? '';
  // 영상은 프록시를 태우지 않는다. /cdn 라우트는 Range 헤더를 업스트림에 전달하지 않아
  // 항상 200(전체 본문)을 내려주므로 ① 탐색(seek)이 사실상 전체 재다운로드가 되고
  // ② 큰 파일이 서버리스 함수를 통과하며 실행 시간 한도에 걸릴 수 있다.
  // Supabase 원본은 Accept-Ranges(206)와 ETag를 지원한다 — cache-control은 no-cache지만
  // 조건부 요청이 304로 끝나므로 재방문 비용은 왕복 1회뿐이다(실측 확인, 2026-08-06).
  if (isVideoUrl(url)) return url;
  const m = url.match(SUPABASE_PUBLIC);
  return m ? `/cdn/${m[1]}` : url;
}
