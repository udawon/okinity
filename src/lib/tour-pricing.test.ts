import { describe, expect, it } from 'vitest';
import { estimateRevenue, tourMeta } from './tour-pricing';

describe('tourMeta — 운영 보드 색·단가용 투어 찾기', () => {
  it('옵션·클래스가 붙은 예약도 투어 단가를 찾는다', () => {
    expect(tourMeta('스노클링 · 푸른동굴 스노클링 · 프라이빗').slug).toBe('blue-cave-snorkeling');
    expect(tourMeta('낚시 · 4시간 체험낚시 · 미들 클래스').slug).toBe('trial-fishing-4h');
    expect(estimateRevenue({ 'blue-cave-snorkeling': 60000 }, tourMeta('스노클링 · 푸른동굴 스노클링 · 일반').slug!, 2)).toBe(120000);
  });

  it('투어를 모르면 slug 없음 · 기본 색', () => {
    expect(tourMeta(undefined)).toEqual({ accent: '#64748b', slug: null });
    expect(tourMeta('낚시').slug).toBeNull();
  });
});
