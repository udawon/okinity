import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { site } from '@/config/site.config';
import { TOUR_CATALOG } from '@/lib/tour';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/about',
    '/reserve',
    '/gallery',
    '/blog',
    '/notice',
    ...TOUR_CATALOG.map((t) => `/tours/${t.slug}`)
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${site.url}/${locale}${p}`,
        lastModified: new Date(),
        // 언어별 대체 URL — 페이지 <head>의 hreflang과 동일한 신호를 사이트맵에도 제공
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${site.url}/${l}${p}`])
          )
        }
      });
    }
  }

  return entries;
}
