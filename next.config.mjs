import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 외부 이미지 호스트를 쓰면 여기에 추가 (예: 인스타 CDN, 스토리지)
    remotePatterns: []
  }
};

export default withNextIntl(nextConfig);
