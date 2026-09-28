import { describe, expect, it } from 'vitest';
import { formatKrw, formatYen } from './money';

describe('formatYen', () => {
  it('로케일별 엔 표기', () => {
    expect(formatYen(13000, 'ko')).toBe('13,000엔');
    expect(formatYen(13000, 'en')).toBe('¥13,000');
    expect(formatYen(130000, 'ja')).toBe('130,000円');
  });
});

describe('formatKrw', () => {
  it('천 단위 구분 + 원', () => {
    expect(formatKrw(1149000)).toBe('1,149,000원');
  });
});
