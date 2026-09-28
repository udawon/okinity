import { describe, expect, it } from 'vitest';
import { displayTitle, groupBlocks, inferTourSlug, parseBlogItems, postTourSlug, type BlogPost } from './blog';

describe('displayTitle', () => {
  it('제목 앞의 6자리 날짜를 떼어낸다(날짜는 따로 표시)', () => {
    expect(displayTitle('260924 케라마 체험다이빙 투어')).toBe('케라마 체험다이빙 투어');
    expect(displayTitle('260816 치비시 크루즈 차터투어 ')).toBe('치비시 크루즈 차터투어');
  });

  it('날짜가 없으면 그대로', () => {
    expect(displayTitle('오키니티 다이빙 블로그를 시작합니다')).toBe('오키니티 다이빙 블로그를 시작합니다');
    expect(displayTitle('2026년 여름 후기')).toBe('2026년 여름 후기');
  });
});

describe('inferTourSlug — 제목에서 투어 추론(확실한 것만)', () => {
  it.each([
    ['260924 케라마 체험다이빙 투어', 'kerama-dive'],
    ['260530 치비시 체험다이빙', 'kerama-dive'],
    ['260904 푸른동굴 스쿠버다이빙 투어', 'blue-cave-dive'],
    ['260818 푸른동굴 체험다이빙', 'blue-cave-dive'],
    ['260822 푸른동굴 스노클링 투어', 'blue-cave-snorkeling'],
    ['260811 푸른동굴 스노클링투어', 'blue-cave-snorkeling'],
    ['260911 마에다비치 스노클링 투어', 'blue-cave-snorkeling'],
    ['260917 마에다비치 스쿠버다이빙 투어', 'blue-cave-dive'],
    ['260619 케라마제도 펀다이빙', 'fun-dive'],
    ['260608 케라마 펀다이빙', 'fun-dive']
  ])('%s → %s', (title, slug) => {
    expect(inferTourSlug(title)).toBe(slug);
  });

  it.each([
    '260913 푸른동굴 투어', // 스노클링인지 다이빙인지 불명
    '260611 만자모 투어',
    '260726 토나키섬 낚시투어 ',
    '260816 치비시 크루즈 차터투어 ',
    '260808 계류 로프 점검',
    '오키니티 다이빙 블로그를 시작합니다'
  ])('%s → 연결 안 함', (title) => {
    expect(inferTourSlug(title)).toBeNull();
  });
});

describe('postTourSlug', () => {
  const base = parseBlogItems([{ id: 'a', title: '260924 케라마 체험다이빙 투어', date: '2026-09-24' }])[0];

  it('어드민이 고른 투어가 추론보다 우선', () => {
    expect(postTourSlug({ ...base, tourSlug: 'fun-dive' })).toBe('fun-dive');
  });

  it('고른 투어가 없거나 목록에 없는 값이면 제목으로 추론', () => {
    expect(postTourSlug(base)).toBe('kerama-dive');
    expect(postTourSlug({ ...base, tourSlug: 'no-such-tour' })).toBe('kerama-dive');
  });

  it('"연결 안 함"(none)을 고르면 추론하지 않는다', () => {
    expect(postTourSlug({ ...base, tourSlug: 'none' })).toBeNull();
  });

  it('기존 저장값(tourSlug 없음)도 읽힌다', () => {
    expect(base.tourSlug).toBe('');
  });
});

describe('groupBlocks — 연속 사진은 한 묶음(그리드)으로', () => {
  const post = (blocks: BlogPost['blocks']) => blocks;
  it('설명 없는 연속 사진을 묶고, 글·영상·설명 달린 사진은 그대로', () => {
    const groups = groupBlocks(
      post([
        { type: 'text', value: '소개' },
        { type: 'image', url: 'a', caption: '' },
        { type: 'image', url: 'b', caption: '' },
        { type: 'video', url: 'v', poster: '', caption: '' },
        { type: 'image', url: 'c', caption: '설명' },
        { type: 'image', url: 'd', caption: '' },
        { type: 'image', url: '', caption: '' }
      ])
    );
    expect(groups.map((g) => g.kind)).toEqual(['text', 'photos', 'video', 'figure', 'photos']);
    expect(groups[1]).toMatchObject({ kind: 'photos', photos: [{ url: 'a', index: 0 }, { url: 'b', index: 1 }] });
    // 사진 순번은 글 전체 기준(라이트박스 이동용), 빈 URL 사진은 제외
    expect(groups[4]).toMatchObject({ kind: 'photos', photos: [{ url: 'd', index: 3 }] });
  });
});
