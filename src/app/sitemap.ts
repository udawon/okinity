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
    '/contact',
    '/blog',
    '/notice',
    ...TOUR_CATALOG.map((t) => `/tours/${t.slug}`)
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${site.url}/${locale}${p}`,
        lastModified: new Date()
      });
    }
  }

  return entries;
}
