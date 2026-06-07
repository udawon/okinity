/**
 * 사이트 메타·연락처·SNS·OG 기본값.
 * 비개발자도 이 파일만 수정하면 연락처/링크/기본 OG를 바꿀 수 있다.
 */
export const site = {
  name: 'OKINITY',
  // 공유·SEO 기본값 (OG 태그). 대표 도메인 okinity.com.
  // Vercel의 NEXT_PUBLIC_SITE_URL 환경변수가 있으면 그 값이 우선(환경별 override용).
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://okinity.com',
  // 공유 미리보기 이미지. 실제 출시 전 1200×630 PNG로 교체 권장(크롤러 호환).
  defaultOgImage: '/images/placeholder.svg',
  // 연락 채널 — 폼 외 직접 연락 경로(푸터 문의 링크)
  contact: {
    // 대표 수신 이메일(푸터 노출 + 문의 알림 수신 기본값). 자체 도메인 확보 시 도메인 메일로 교체.
    email: 'okinity8@gmail.com',
    // 카카오톡 채널 URL (예: http://pf.kakao.com/_xxxxxx). 비우면 푸터에서 숨김.
    kakaoChannel: 'http://pf.kakao.com/_GLkxlX',
    // LINE URL (예: https://lin.ee/xxxxxx 또는 https://line.me/ti/p/@xxxx). 비우면 푸터에서 숨김.
    line: 'https://lin.ee/vdxgimQ'
  },
  // 푸터 주소·연락처 (일본 본사)
  address: {
    postal: '〒902-0075',
    line: '192-3, Kokuba, Naha-Si, Okinawa-Ken, JAPAN',
    representative: '代表　比嘉海斗'
  },
  phone: '+81-90-1947-5156'
} as const;

export type Site = typeof site;
