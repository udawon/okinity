/**
 * 사이트 메타·연락처·SNS·OG 기본값.
 * 비개발자도 이 파일만 수정하면 연락처/링크/기본 OG를 바꿀 수 있다.
 */
export const site = {
  name: 'OKINITY',
  // 공유·SEO 기본값 (OG 태그). 대표 도메인 okinity.com.
  // Vercel의 NEXT_PUBLIC_SITE_URL 환경변수가 있으면 그 값이 우선(환경별 override용).
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://okinity.com',
  // 공유 미리보기 이미지(OG). 1200×630 PNG — 카카오톡·SNS 호환(SVG는 미지원).
  defaultOgImage: '/og-image.png',
  // 연락 채널 — 폼 외 직접 연락 경로(푸터 문의 링크)
  contact: {
    // 대표 수신 이메일(푸터 노출 + 문의 알림 수신 기본값). 자체 도메인 확보 시 도메인 메일로 교체.
    email: 'okinity8@gmail.com',
    // 카카오톡 채널 URL (예: http://pf.kakao.com/_xxxxxx). 비우면 푸터에서 숨김.
    kakaoChannel: 'https://pf.kakao.com/_GLkxlX',
    // LINE URL (예: https://lin.ee/xxxxxx 또는 https://line.me/ti/p/@xxxx). 비우면 푸터에서 숨김.
    line: 'https://lin.ee/vdxgimQ'
  },
  // 푸터 주소·연락처 (일본 본사)
  address: {
    postal: '〒902-0075',
    line: '192-3, Kokuba, Naha-Si, Okinawa-Ken, JAPAN'
  },
  // 대표 — 허범영과 比嘉海斗(일본 이름)는 같은 사람. 두 이름을 함께 적어 검색·AI 가 대표를 두 사람으로
  // 오해하지 않게 한다(2026-11-18 원님 결정). 하단 표기는 언어별, names 는 구조화 데이터용 전체 이름.
  representative: {
    ko: '허범영 (比嘉海斗)',
    en: 'Beomyoung Heo (Higa Kaito)',
    ja: '比嘉海斗（ホ・ボミョン）',
    names: { ko: '허범영', en: 'Beomyoung Heo', ja: '比嘉海斗' },
    // 블로그 글 작성자 표시(손님에게 익숙한 이름, 소개 페이지의 "A.K.A 포뇨강사")
    byline: '포뇨강사',
    aliases: ['허범영', '比嘉海斗', 'Beomyoung Heo', 'Higa Kaito', 'ホ・ボミョン', '포뇨강사', 'Instructor Ponyo']
  },
  phone: '+81-90-1947-5156'
} as const;

export type Site = typeof site;
