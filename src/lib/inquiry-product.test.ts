import { describe, expect, it } from 'vitest';
import { buildProduct, parseProduct } from './inquiry-product';

describe('parseProduct — 예약 상품명 해석', () => {
  it('옵션·클래스가 붙은 상품명도 투어를 찾고 나머지를 따로 돌려준다', () => {
    expect(parseProduct('낚시 · 4시간 체험낚시 · 미들 클래스')).toEqual({
      catId: 'fishing',
      slug: 'trial-fishing-4h',
      extra: '미들 클래스'
    });
    expect(parseProduct('스노클링 · 푸른동굴 스노클링 · 프라이빗')).toEqual({
      catId: 'snorkeling',
      slug: 'blue-cave-snorkeling',
      extra: '프라이빗'
    });
  });

  it('옵션 없는 기존 상품명은 그대로 해석된다', () => {
    expect(parseProduct('스노클링 · 푸른동굴 스노클링')).toEqual({
      catId: 'snorkeling',
      slug: 'blue-cave-snorkeling',
      extra: ''
    });
  });

  it('대분류만 있거나 모르는 투어면 slug 는 비운다', () => {
    expect(parseProduct('낚시')).toEqual({ catId: 'fishing', slug: '', extra: '' });
    expect(parseProduct('낚시 · 없는 투어')).toEqual({ catId: 'fishing', slug: '', extra: '' });
  });

  it('비어 있으면 모두 빈 값', () => {
    expect(parseProduct(undefined)).toEqual({ catId: '', slug: '', extra: '' });
    expect(parseProduct('')).toEqual({ catId: '', slug: '', extra: '' });
  });
});

describe('buildProduct — 예약 상품명 만들기', () => {
  it('비어 있는 부분은 건너뛴다', () => {
    expect(buildProduct('스노클링', '푸른동굴 스노클링', '프라이빗')).toBe('스노클링 · 푸른동굴 스노클링 · 프라이빗');
    expect(buildProduct('스노클링', '푸른동굴 스노클링', '  ')).toBe('스노클링 · 푸른동굴 스노클링');
    expect(buildProduct('낚시', '', '')).toBe('낚시');
    expect(buildProduct('', '푸른동굴 스노클링', '프라이빗')).toBe('');
  });

  it('만든 상품명은 다시 같은 값으로 해석된다', () => {
    const p = buildProduct('낚시', '8시간 빅게임 트롤링', '럭셔리 클래스');
    expect(parseProduct(p)).toEqual({ catId: 'fishing', slug: 'biggame-trolling-8h', extra: '럭셔리 클래스' });
  });
});
