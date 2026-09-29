import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { site } from '@/config/site.config';
import { TOUR_CATALOG, isTourPublished, resolveTourDetail } from '@/lib/tour';
import { getSiteContentMap, CONTENT_KEYS } from '@/lib/site-content';
import { parseBlogItems } from '@/lib/blog';
import { parseNoticeItems } from '@/lib/notice';
import { sitemapPaths } from '@/lib/sitemap-entries';

// 글·투어 공개 여부를 읽으므로 한 시간마다 다시 만든다.
export const revalidate = 3600;

/**
 * 실제로 열리는 공개 페이지만 — 블로그·공지는 한국어만(EN/JA 주소는 홈으로 넘어감), 개별 글 포함,
 * 비공개 투어·글 제외. 규칙은 lib/sitemap-entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tourKeys = TOUR_CATALOG.map((t) => CONTENT_KEYS.tour(t.slug));
  const map = await getSiteContentMap([...tourKeys, CONTENT_KEYS.blog, CONTENT_KEYS.notice]);
  // 저장소를 못 읽었으면(빈 map) 투어를 빼지 않는다 — 일시 장애로 투어가 sitemap 에서 사라지지 않게.
  const known = Object.keys(map).length > 0;
  const paths = sitemapPaths(
    {
      tours: TOUR_CATALOG.map((t) => ({
        slug: t.slug,
        published: !known || isTourPublished(resolveTourDetail(t.slug, map[CONTENT_KEYS.tour(t.slug)] ?? null))
      })),
      blog: parseBlogItems(map[CONTENT_KEYS.blog]?.items),
      notice: parseNoticeItems(map[CONTENT_KEYS.notice]?.items)
    },
    [...routing.locales]
  );

  return paths.flatMap((p) =>
    p.locales.map((locale) => ({
      url: `${site.url}/${locale}${p.path}`,
      ...(p.lastModified ? { lastModified: new Date(`${p.lastModified}T00:00:00Z`) } : {}),
      // 언어별 대체 URL — 페이지 <head>의 hreflang과 동일한 신호(여러 언어로 열리는 주소만)
      ...(p.locales.length > 1
        ? { alternates: { languages: Object.fromEntries(p.locales.map((l) => [l, `${site.url}/${l}${p.path}`])) } }
        : {})
    }))
  );
}
