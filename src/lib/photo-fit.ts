/**
 * 사진 표시 규칙 — 투어 갤러리·크게 보기(라이트박스) 공용. 범용 모듈(DOM 의존 없음).
 */

/**
 * 세로 사진(높이 > 너비)이면 칸에 맞춰 잘라내지 않고 전체를 보여준다.
 * 크기를 모르면(로드 전·실패) false — 기존처럼 칸을 채운다.
 */
export function isPortrait(width: number, height: number): boolean {
  return width > 0 && height > width;
}

/**
 * 크게 보기 화면의 좌우 스와이프 판정. 다음 사진 = 1, 이전 = -1, 넘기지 않음 = 0.
 * 가로 이동이 threshold(px) 이상이고 세로 이동보다 클 때만 넘긴다(세로 스크롤·손떨림 무시).
 */
export function swipeStep(dx: number, dy: number, threshold = 50): -1 | 0 | 1 {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}
