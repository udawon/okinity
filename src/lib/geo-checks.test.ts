import { describe, expect, it } from 'vitest';
import {
  GEO_PLATFORM_GUIDE,
  GEO_PLATFORMS,
  GEO_QUESTIONS,
  NewGeoCheckSchema,
  monthMatrix,
  summarizeByMonth,
  type GeoCheck
} from './geo-checks';

describe('질문·플랫폼 — 달마다 비교하려고 고정(2026-11-18 원님 확정)', () => {
  it('질문 10개, 플랫폼 4개', () => {
    expect(GEO_QUESTIONS).toHaveLength(10);
    expect(GEO_QUESTIONS[0]).toBe('오키나와 푸른동굴 스노클링 업체 추천해줘');
    expect(GEO_QUESTIONS[9]).toBe('오키니티(OKINITY) 어때? 후기 알려줘');
    expect(GEO_PLATFORMS).toEqual(['ChatGPT', '구글 AI 개요', '네이버 AI 브리핑', 'Claude']);
  });
});

describe('NewGeoCheckSchema — 기록 입력 검증', () => {
  it('날짜·플랫폼·질문 필수, 나머지는 선택', () => {
    const ok = NewGeoCheckSchema.safeParse({
      checkedOn: '2026-11-18',
      platform: 'ChatGPT',
      question: GEO_QUESTIONS[0],
      mentioned: true,
      cited: false,
      recommended: true,
      citedUrl: '',
      competitors: '',
      summary: ''
    });
    expect(ok.success).toBe(true);
    expect(NewGeoCheckSchema.safeParse({ checkedOn: '18일', platform: 'ChatGPT', question: 'q' }).success).toBe(false);
    expect(NewGeoCheckSchema.safeParse({ checkedOn: '2026-11-18', platform: '', question: 'q' }).success).toBe(false);
  });
  it('출처 URL 은 http(s) 만', () => {
    const base = { checkedOn: '2026-11-18', platform: 'ChatGPT', question: 'q' };
    expect(NewGeoCheckSchema.safeParse({ ...base, citedUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(NewGeoCheckSchema.safeParse({ ...base, citedUrl: 'https://okinity.com/ko' }).success).toBe(true);
  });
});

describe('summarizeByMonth — 월별 언급·출처·추천 수', () => {
  const c = (checkedOn: string, platform: string, question: string, m: boolean, ci: boolean, r: boolean, createdAt = ''): GeoCheck => ({
    id: checkedOn + platform + question + createdAt,
    checkedOn,
    platform,
    question,
    mentioned: m,
    cited: ci,
    recommended: r,
    createdAt
  });
  it('최근 달부터, 플랫폼별 집계와 합계', () => {
    const s = summarizeByMonth([
      c('2026-11-18', 'ChatGPT', 'q1', true, true, false),
      c('2026-11-18', 'ChatGPT', 'q2', false, false, false),
      c('2026-11-19', 'Claude', 'q1', true, false, true),
      c('2026-10-02', 'ChatGPT', 'q1', false, false, false)
    ]);
    expect(s.map((m) => m.month)).toEqual(['2026-11', '2026-10']);
    expect(s[0].total).toEqual({ checks: 3, mentioned: 2, cited: 1, recommended: 1 });
    expect(s[0].byPlatform.ChatGPT).toEqual({ checks: 2, mentioned: 1, cited: 1, recommended: 0 });
    expect(s[1].total.checks).toBe(1);
  });
  it('같은 달 같은 플랫폼·질문을 다시 기록하면 최신 것만 센다(달마다 분모 10개 유지)', () => {
    const s = summarizeByMonth([
      c('2026-11-03', 'ChatGPT', 'q1', false, false, false),
      c('2026-11-25', 'ChatGPT', 'q1', true, false, false)
    ]);
    expect(s[0].total).toEqual({ checks: 1, mentioned: 1, cited: 0, recommended: 0 });
  });

  it('monthMatrix — 그달 질문 × 플랫폼 표(최신 기록)', () => {
    const m = monthMatrix(
      [
        c('2026-11-03', 'ChatGPT', 'q1', false, false, false, '2026-11-03T00:00:00Z'),
        c('2026-11-03', 'ChatGPT', 'q1', true, false, false, '2026-11-03T05:00:00Z'),
        c('2026-11-04', 'Claude', 'q2', false, true, false),
        c('2026-10-04', 'Claude', 'q1', true, true, true)
      ],
      '2026-11'
    );
    expect(m.q1.ChatGPT.mentioned).toBe(true);
    expect(m.q1.Claude).toBeUndefined();
    expect(m.q2.Claude.cited).toBe(true);
  });
});

describe('GEO_PLATFORM_GUIDE — 플랫폼별 묻는 방법(어드민 매뉴얼)', () => {
  it('모든 플랫폼에 어디서·어떻게가 있다', () => {
    for (const p of GEO_PLATFORMS) {
      expect(GEO_PLATFORM_GUIDE[p].where.length).toBeGreaterThan(0);
      expect(GEO_PLATFORM_GUIDE[p].steps.length).toBeGreaterThanOrEqual(3);
    }
  });
});
