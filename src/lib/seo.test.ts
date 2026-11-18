import { describe, expect, it } from 'vitest';
import { koOnlyAlternates } from './seo';

describe('koOnlyAlternates — 한국어 전용 페이지(블로그·공지)', () => {
  it('canonical 은 한국어, hreflang 은 ko·x-default 만(EN/JA 주소는 홈으로 넘어가므로 선언하지 않는다)', () => {
    expect(koOnlyAlternates('/blog/b-1')).toEqual({
      canonical: 'https://okinity.com/ko/blog/b-1',
      languages: { ko: 'https://okinity.com/ko/blog/b-1', 'x-default': 'https://okinity.com/ko/blog/b-1' }
    });
  });
});
