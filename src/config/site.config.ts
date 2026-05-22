/**
 * 사이트 메타·연락처·SNS·OG 기본값.
 * 비개발자도 이 파일만 수정하면 연락처/링크/기본 OG를 바꿀 수 있다.
 */
export const site = {
  name: 'PONYOKINAWA',
  // 공유·SEO 기본값 (OG 태그). 배포 시 NEXT_PUBLIC_SITE_URL 환경변수로 도메인 지정.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ponyokinawa.com',
  // 공유 미리보기 이미지. 실제 출시 전 1200×630 PNG로 교체 권장(크롤러 호환).
  defaultOgImage: '/images/placeholder.svg',
  // 연락 채널 — 폼 외 직접 연락 경로
  contact: {
    email: 'hello@ponyokinawa.com',
    kakaoOpenChat: '', // 예: https://open.kakao.com/o/xxxx
    instagram: '' // 예: https://instagram.com/ponyokinawa
  }
} as const;

export type Site = typeof site;
