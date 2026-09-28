import { describe, expect, it } from 'vitest';
import { isPortrait, swipeStep } from './photo-fit';

describe('isPortrait — 세로 사진 판정', () => {
  it('높이가 너비보다 크면 세로 사진', () => {
    expect(isPortrait(1125, 2000)).toBe(true);
    expect(isPortrait(1500, 2000)).toBe(true);
  });

  it('가로·정사각형 사진은 세로가 아니다(기존처럼 칸을 채운다)', () => {
    expect(isPortrait(2000, 1125)).toBe(false);
    expect(isPortrait(1000, 1000)).toBe(false);
  });

  it('크기를 모르면(로드 전·실패) 세로로 보지 않는다', () => {
    expect(isPortrait(0, 0)).toBe(false);
    expect(isPortrait(0, 800)).toBe(false);
  });
});

describe('swipeStep — 크게 보기 화면 좌우 넘김', () => {
  it('왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전', () => {
    expect(swipeStep(-80, 10)).toBe(1);
    expect(swipeStep(80, -10)).toBe(-1);
  });

  it('짧게 움직였거나 세로로 더 많이 움직였으면 넘기지 않는다', () => {
    expect(swipeStep(-30, 0)).toBe(0);
    expect(swipeStep(-80, 120)).toBe(0);
    expect(swipeStep(0, 0)).toBe(0);
  });
});
