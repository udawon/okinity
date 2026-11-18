import { describe, expect, it } from 'vitest';
import { homeTextDoc } from './home-content';

describe('homeTextDoc — 언어별 홈 문구 문서', () => {
  const map = {
    home_assurances: { items: [{ title: '소수정예', desc: '' }] },
    'home_assurances:en': { items: [{ title: 'Small groups', desc: '' }] },
    hero: { title: '바다가 시작되는 곳' }
  };

  it('한국어는 기본 키', () => {
    expect(homeTextDoc(map, 'home_assurances', 'ko')).toEqual({ items: [{ title: '소수정예', desc: '' }] });
  });

  it('EN/JA 는 번역본 키', () => {
    expect(homeTextDoc(map, 'home_assurances', 'en')).toEqual({ items: [{ title: 'Small groups', desc: '' }] });
  });

  it('번역본이 없으면 한국어로 대신하지 않는다(EN/JA 홈에 한국어가 섞이지 않게 — 기본 번역 문구 사용)', () => {
    expect(homeTextDoc(map, 'home_assurances', 'ja')).toBeUndefined();
    expect(homeTextDoc(map, 'hero', 'en')).toBeUndefined();
  });
});
