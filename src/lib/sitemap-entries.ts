/**
 * sitemap 에 넣을 주소 — 실제로 열리는 공개 페이지만.
 * 블로그·공지는 한국어 전용(EN/JA 주소는 홈으로 넘어감)이라 한국어만, 비공개 글·비공개 투어는 제외.
 * 범용 순수 모듈(app/sitemap.ts 가 데이터를 읽어 넘긴다).
 */
export type SitemapPath = { path: string; locales: string[]; lastModified?: string };

type Post = { id: string; date: string; published: boolean };

export function sitemapPaths(
  input: { tours: { slug: string; published: boolean }[]; blog: Post[]; notice: Post[] },
  locales: string[] = ['ko', 'en', 'ja']
): SitemapPath[] {
  const ko = ['ko'];
  const posts = (base: string, list: Post[]) =>
    list.filter((p) => p.published).map((p) => ({ path: `${base}/${p.id}`, locales: ko, lastModified: p.date }));
  return [
    ...['', '/about', '/reserve', '/gallery'].map((path) => ({ path, locales })),
    ...input.tours.filter((t) => t.published).map((t) => ({ path: `/tours/${t.slug}`, locales })),
    { path: '/blog', locales: ko },
    { path: '/notice', locales: ko },
    ...posts('/blog', input.blog),
    ...posts('/notice', input.notice)
  ];
}
