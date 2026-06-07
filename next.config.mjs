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
  // 1단계(저위험): HSTS·MIME·클릭재킹·리퍼러·권한. CSP는 별도(아래 참조).
  async headers() {
    const securityHeaders = [
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
