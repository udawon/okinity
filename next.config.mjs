import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 외부 이미지 호스트를 쓰면 여기에 추가 (예: 인스타 CDN, 스토리지)
    remotePatterns: []
  },
  experimental: {
    // 미디어 업로드는 Server Action 본문으로 전송된다. 기본 1MB 한도를 상향.
    // (클라이언트에서 이미지는 자동 압축하므로 대부분 1MB 이하지만, 동영상·원본 대비 여유)
    serverActions: { bodySizeLimit: '12mb' }
  },
  // 보안 응답 헤더 — 모든 경로에 적용.
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    // CSP — 실제 사용 origin에 맞춤:
    //  · 이미지/비디오: 로컬(self) + data:/blob: + Supabase Storage 공개 URL
    //  · 스타일: 인라인 다수(framer-motion style=, style={}) → 'unsafe-inline'
    //  · 스크립트: Next 부트스트랩 인라인 → 'unsafe-inline' (dev는 HMR용 eval 추가)
    //  · connect: Supabase + (dev) HMR 웹소켓
    // 참고: script 'unsafe-inline' 제거(nonce 기반 strict-CSP)는 미들웨어 nonce 주입이 필요한 후속 강화 과제.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "media-src 'self' blob: https://*.supabase.co",
      `connect-src 'self' https://*.supabase.co${isDev ? ' ws: http://localhost:*' : ''}`,
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(isDev ? [] : ['upgrade-insecure-requests'])
    ].join('; ');
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      // HTTPS 강제(2년 + 서브도메인 + preload). HTTP/localhost에서는 브라우저가 무시.
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // MIME 스니핑 차단.
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // 클릭재킹 방지(동일 출처 외 iframe 임베드 금지). CSP frame-ancestors의 폴백.
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // 외부 이동 시 경로·쿼리 미유출(동일 출처에만 전체 URL).
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // 민감 권한 전면 차단(사용 안 함).
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' }
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};

export default withNextIntl(nextConfig);
