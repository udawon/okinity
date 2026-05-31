import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { site } from '@/config/site.config';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/about',
    '/diving',
    '/padi',
    '/schedule',
    '/gallery',
    '/contact',
    '/blog',
    '/notice'
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
