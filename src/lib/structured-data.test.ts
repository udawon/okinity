import { describe, expect, it } from 'vitest';
import { blogPostingJsonLd, representativePerson } from './structured-data';

describe('representativePerson — 대표(한국·일본 이름이 같은 사람)', () => {
  it('언어별 대표 이름, 나머지 표기는 alternateName 으로 전부', () => {
    const ko = representativePerson('ko', '대표');
    expect(ko.name).toBe('허범영');
    expect(ko.alternateName).toContain('比嘉海斗');
    expect(ko.alternateName).toContain('포뇨강사');
    expect(ko.alternateName).not.toContain('허범영');
    expect(ko['@id']).toBe('https://okinity.com/#representative');
    expect(ko.worksFor).toEqual({ '@id': 'https://okinity.com/#business' });
    expect(representativePerson('ja', '代表').name).toBe('比嘉海斗');
    expect(representativePerson('en', 'Representative').name).toBe('Beomyoung Heo');
  });
});

describe('blogPostingJsonLd — 블로그 글 구조화 데이터', () => {
  const base = {
    id: 'b-1',
    headline: '푸른동굴 투어',
    date: '2026-11-05',
    description: '2026년 11월 5일 오키니티 현장 기록.',
    images: ['/cdn/blog/a.jpg', 'https://cdn.example.com/b.jpg', '']
  };

  it('작성일·작성자(대표와 같은 사람)·발행처·주소', () => {
    const ld = blogPostingJsonLd({ ...base, tour: null });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('푸른동굴 투어');
    expect(ld.datePublished).toBe('2026-11-05');
    expect(ld.inLanguage).toBe('ko');
    expect(ld.mainEntityOfPage).toBe('https://okinity.com/ko/blog/b-1');
    expect(ld.author).toMatchObject({ '@id': 'https://okinity.com/#representative', name: '허범영' });
    expect(ld.publisher).toMatchObject({ '@id': 'https://okinity.com/#business', name: 'OKINITY' });
    expect(ld.about).toBeUndefined();
  });

  it('사진은 절대 주소로, 빈 값은 뺀다', () => {
    const ld = blogPostingJsonLd({ ...base, tour: null });
    expect(ld.image).toEqual(['https://okinity.com/cdn/blog/a.jpg', 'https://cdn.example.com/b.jpg']);
  });

  it('이 날의 투어가 있으면 about 으로 연결', () => {
    const ld = blogPostingJsonLd({ ...base, tour: { slug: 'blue-cave-dive', name: '푸른동굴 보트 체험다이빙' } });
    expect(ld.about).toEqual({
      '@type': 'TouristTrip',
      name: '푸른동굴 보트 체험다이빙',
      url: 'https://okinity.com/ko/tours/blue-cave-dive'
    });
  });
});
