/**
 * 어드민 숫자 칸(요금) 입력 해석 — "13,000엔"·"¥13,000"·"13,000 円"처럼 적어도 숫자로 읽고,
 * 읽을 수 없는 글("만삼천", "13000~15000")은 ok=false 로 알려 조용히 빈 값이 되지 않게 한다.
 * 범용 순수 모듈.
 */
export function parseYenInput(v: string): { value: number | null; ok: boolean } {
  const s = v.trim();
  if (!s) return { value: null, ok: true };
  const cleaned = s.replace(/[,\s]/g, '').replace(/^¥/, '').replace(/(엔|円|yen)$/i, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return { value: null, ok: false };
  return { value: Number(cleaned), ok: true };
}
