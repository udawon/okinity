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
  }
};

export default withNextIntl(nextConfig);
