import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getAllProductSlugs } from '@/lib/content';
import { site } from '@/config/site.config';

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllProductSlugs();
  const staticPaths = ['', '/products', '/instructor', '/contact'];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${site.url}/${locale}${p}`,
        lastModified: new Date()
      });
    }
    for (const slug of slugs) {
      entries.push({
        url: `${site.url}/${locale}/products/${slug}`,
        lastModified: new Date()
      });
    }
  }

  return entries;
}
