/**
 * 업로드 상한 — 파일 본문이 서버를 거치지 않으므로 플랫폼 한도가 아니라 "방문자 부담" 기준.
 * 영상 50MB: Supabase 프로젝트 기본 파일 상한과도 일치하고, 1080p 1~2분 클립이 들어가는 크기.
 * 이 값을 넘는 영상은 거부하지 않고 브라우저에서 자동 압축해 한도 안에 맞춘다(video-compress.ts).
 *
 * 서버 액션(content-actions)과 클라이언트(upload-client)가 같은 값을 봐야 해서 별도 모듈로 둔다
 * ('use server' 모듈은 async 함수만 export 할 수 있어 상수를 내보낼 수 없다).
 */
export const UPLOAD_LIMITS = {
  image: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024
} as const;
