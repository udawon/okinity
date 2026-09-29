import { describe, expect, it } from 'vitest';
import { sitemapPaths } from './sitemap-entries';

describe('sitemapPaths — 검색엔진에 알릴 주소', () => {
  const paths = sitemapPaths({
    tours: [
      { slug: 'a', published: true },
      { slug: 'b', published: false }
    ],
    blog: [
      { id: 'b-1', date: '2026-09-20', published: true },
      { id: 'b-2', date: '2026-09-21', published: false }
    ],
    notice: [{ id: 'n-1', date: '2026-09-01', published: true }]
  });
  const urls = paths.map((p) => p.path);

  it('블로그·공지(목록·글)는 한국어만 — EN/JA 는 홈으로 넘어가는 주소라 넣지 않는다', () => {
    expect(paths.find((p) => p.path === '/blog')?.locales).toEqual(['ko']);
    expect(paths.find((p) => p.path === '/notice')?.locales).toEqual(['ko']);
    expect(urls).toContain('/blog/b-1');
    expect(urls).toContain('/notice/n-1');
    expect(paths.find((p) => p.path === '/blog/b-1')).toMatchObject({ locales: ['ko'], lastModified: '2026-09-20' });
  });
  it('비공개 글·비공개 투어는 넣지 않는다', () => {
    expect(urls).not.toContain('/blog/b-2');
    expect(urls).toContain('/tours/a');
    expect(urls).not.toContain('/tours/b');
  });
  it('공개 페이지는 세 언어', () => {
    expect(paths.find((p) => p.path === '')?.locales).toEqual(['ko', 'en', 'ja']);
    expect(paths.find((p) => p.path === '/tours/a')?.locales).toEqual(['ko', 'en', 'ja']);
  });
});
