import { describe, expect, it } from 'vitest';
import { parseYenInput } from './number-input';

describe('parseYenInput — 요금 칸 글 → 숫자', () => {
  it('쉼표·엔·円·¥·공백을 허용한다', () => {
    expect(parseYenInput('13000')).toEqual({ value: 13000, ok: true });
    expect(parseYenInput('13,000엔')).toEqual({ value: 13000, ok: true });
    expect(parseYenInput(' ¥13,000 ')).toEqual({ value: 13000, ok: true });
    expect(parseYenInput('13,000 円')).toEqual({ value: 13000, ok: true });
  });
  it('빈 칸은 값 없음(정상)', () => {
    expect(parseYenInput('')).toEqual({ value: null, ok: true });
    expect(parseYenInput('   ')).toEqual({ value: null, ok: true });
  });
  it('숫자로 읽을 수 없으면 ok=false(조용히 비우지 않는다)', () => {
    expect(parseYenInput('만삼천')).toEqual({ value: null, ok: false });
    expect(parseYenInput('13000~15000')).toEqual({ value: null, ok: false });
    expect(parseYenInput('-500')).toEqual({ value: null, ok: false });
    expect(parseYenInput('13,000원')).toEqual({ value: null, ok: false });
  });
});
