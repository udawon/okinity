/**
 * 섹션 탭의 "지금 보고 있는 섹션" 계산 — 순수 함수(DOM 측정값은 컴포넌트가 넘긴다).
 * top: 화면 위 기준 섹션 제목 위치(px), offset: 탭 바 아래 기준선(px).
 */
export function pickActiveSection(
  sections: { id: string; top: number }[],
  offset: number,
  atBottom: boolean
): string | null {
  if (!sections.length) return null;
  if (atBottom) return sections[sections.length - 1].id;
  let current = sections[0].id;
  for (const s of sections) if (s.top <= offset) current = s.id;
  return current;
}
