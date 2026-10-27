import { describe, expect, it } from 'vitest';
import { nearestSlide, slideDepth, slideOffset, stepSlide } from './photo-slider';

describe('slideOffset — 슬라이드 중심이 화면 중심에서 몇 장 떨어졌나', () => {
  it('정중앙이면 0, 한 장 오른쪽이면 1, 왼쪽이면 -1', () => {
    // 슬라이드 폭 300, 화면 폭 400 → 화면 중심 200 + scrollLeft
    expect(slideOffset(50, 300, 0, 400)).toBe(0);
    expect(slideOffset(350, 300, 0, 400)).toBe(1);
    expect(slideOffset(350, 300, 300, 400)).toBe(0);
    expect(slideOffset(50, 300, 300, 400)).toBe(-1);
  });

  it('폭이 0이면(로드 전) 0 — 0으로 나누지 않는다', () => {
    expect(slideOffset(10, 0, 0, 400)).toBe(0);
  });
});

describe('slideDepth — 중앙에서 멀수록 작고 어둡게, 사진은 반대로 흐른다(패럴랙스)', () => {
  it('가운데 슬라이드는 원래 크기·밝기, 이동 없음', () => {
    const d = slideDepth(0);
    expect(d.scale).toBe(1);
    expect(d.dim).toBe(0);
    expect(Math.abs(d.shift)).toBe(0);
  });

  it('옆 슬라이드는 작아지고 어두워지며 사진이 슬라이드와 반대 방향으로 밀린다', () => {
    const right = slideDepth(1);
    expect(right.scale).toBeLessThan(1);
    expect(right.dim).toBeGreaterThan(0);
    expect(right.shift).toBeLessThan(0);
    expect(slideDepth(-1).shift).toBeGreaterThan(0);
  });

  it('두 장 이상 떨어져도 한 장 거리와 같게(값이 튀지 않게)', () => {
    expect(slideDepth(3)).toEqual(slideDepth(1));
    expect(slideDepth(-5)).toEqual(slideDepth(-1));
  });

  it('효과를 끄면(움직임 줄이기 설정) 항상 기본값', () => {
    expect(slideDepth(1, false)).toEqual({ shift: 0, scale: 1, dim: 0 });
  });
});

describe('nearestSlide — 중앙에 가장 가까운 슬라이드', () => {
  it('|offset| 이 가장 작은 칸', () => {
    expect(nearestSlide([-1.2, -0.2, 0.8])).toBe(1);
    expect(nearestSlide([0, 1, 2])).toBe(0);
    expect(nearestSlide([-2, -1, -0.4])).toBe(2);
  });

  it('비어 있으면 0', () => {
    expect(nearestSlide([])).toBe(0);
  });
});

describe('stepSlide — 화살표·키보드 이동(끝에서 멈춤)', () => {
  it('범위 안에서 이동', () => {
    expect(stepSlide(0, 1, 5)).toBe(1);
    expect(stepSlide(3, -1, 5)).toBe(2);
  });

  it('처음·끝을 넘지 않는다', () => {
    expect(stepSlide(0, -1, 5)).toBe(0);
    expect(stepSlide(4, 1, 5)).toBe(4);
  });
});
