/**
 * 사진 슬라이드 계산 — 블로그 본문 슬라이드 공용. 범용 모듈(DOM 의존 없음).
 *
 * 깊이감 연출: 슬라이드가 화면 중앙에서 멀어질수록 조금 작아지고 어두워지며,
 * 안쪽 사진은 슬라이드와 반대 방향으로 천천히 흐른다(패럴랙스).
 */

/** 이미지가 반대로 흐르는 최대 거리(사진 폭 대비 %). 사진은 이만큼 여유 있게 확대해 둔다. */
export const PARALLAX_SHIFT = 18;
const MIN_SCALE = 0.92;
const MAX_DIM = 0.55;

/** 슬라이드 중심이 화면 중심에서 몇 장(슬라이드 폭 단위) 떨어졌나. 오른쪽 +, 왼쪽 -. */
export function slideOffset(slideLeft: number, slideWidth: number, scrollLeft: number, viewportWidth: number): number {
  if (slideWidth <= 0) return 0;
  return (slideLeft + slideWidth / 2 - (scrollLeft + viewportWidth / 2)) / slideWidth;
}

/** 거리 → 깊이 효과. shift = 사진 이동(%), scale = 슬라이드 크기, dim = 어둡게 덮는 정도(0~1). */
export function slideDepth(offset: number, enabled = true): { shift: number; scale: number; dim: number } {
  if (!enabled) return { shift: 0, scale: 1, dim: 0 };
  const d = Math.max(-1, Math.min(1, offset));
  const a = Math.abs(d);
  return {
    shift: d === 0 ? 0 : -d * PARALLAX_SHIFT,
    scale: 1 - a * (1 - MIN_SCALE),
    dim: a * MAX_DIM
  };
}

/** 중앙에 가장 가까운 슬라이드 번호. */
export function nearestSlide(offsets: number[]): number {
  let best = 0;
  for (let i = 1; i < offsets.length; i++) {
    if (Math.abs(offsets[i]) < Math.abs(offsets[best])) best = i;
  }
  return best;
}

/** 화살표·키보드 한 칸 이동 — 처음·끝에서 멈춘다. */
export function stepSlide(current: number, delta: -1 | 1, count: number): number {
  return Math.max(0, Math.min(count - 1, current + delta));
}
