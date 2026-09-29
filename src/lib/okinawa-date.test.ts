import { describe, expect, it } from 'vitest';
import { formatDateKeyLong, okinawaTodayKey } from './okinawa-date';

describe('okinawaTodayKey — 영업지(오키나와) 기준 오늘', () => {
  it('UTC 전날 밤이어도 오키나와가 다음 날이면 다음 날', () => {
    // 2026-09-28 16:30 UTC = 2026-09-29 01:30 JST (한국·일본 새벽 — 서버와 방문자 날짜가 갈리던 시간)
    expect(okinawaTodayKey(new Date('2026-09-28T16:30:00Z'))).toBe('2026-09-29');
  });

  it('오키나와 자정 직전은 그날', () => {
    expect(okinawaTodayKey(new Date('2026-09-29T14:59:59Z'))).toBe('2026-09-29');
    expect(okinawaTodayKey(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });
});

describe('formatDateKeyLong — 고른 날짜 그대로 표시', () => {
  it('방문자 시간대와 무관하게 같은 날짜·요일', () => {
    expect(formatDateKeyLong('2026-09-28', 'en')).toBe('Monday, September 28, 2026');
    expect(formatDateKeyLong('2026-09-28', 'ko')).toBe('2026년 9월 28일 월요일');
    expect(formatDateKeyLong('2026-01-01', 'ja')).toBe('2026年1月1日木曜日');
  });

  it('형식이 틀리면 빈 글', () => {
    expect(formatDateKeyLong('', 'ko')).toBe('');
    expect(formatDateKeyLong('2026-13-40', 'ko')).toBe('');
  });
});
