/**
 * 처음·마지막 유입처 기억(브라우저 localStorage) — 예약 문의에 "처음 ChatGPT · 마지막 네이버"를 남기려고.
 * 처음 유입처는 30일 동안 유지, 마지막은 외부에서 들어올 때마다 갱신. 사이트 안 이동은 무시.
 * 직접 방문(즐겨찾기·주소 입력·referrer 없는 앱)은 기억이 있으면 덮어쓰지 않는다 — "마지막 비직접 유입"
 * (ChatGPT 로 알고 나중에 즐겨찾기로 와서 문의해도 AI 기여가 남게).
 * 규칙은 순수 함수(nextSourceMemory)로 두고, 읽기·쓰기는 브라우저 전용 함수로 분리한다.
 */

export const FIRST_TOUCH_DAYS = 30;
const KEY = 'okinity-src';

export type SourceMemory = { first: { s: string; t: number }; last: string };

export function nextSourceMemory(prev: SourceMemory | null, current: string, now: number): SourceMemory {
  const fresh = prev && now - prev.first.t <= FIRST_TOUCH_DAYS * 86_400_000;
  if (current === 'internal' || current === 'direct')
    return fresh && prev ? prev : { first: { s: 'direct', t: now }, last: 'direct' };
  return fresh && prev ? { first: prev.first, last: current } : { first: { s: current, t: now }, last: current };
}

function parse(raw: string | null): SourceMemory | null {
  try {
    const v = raw ? (JSON.parse(raw) as SourceMemory) : null;
    return v && typeof v.first?.s === 'string' && typeof v.first?.t === 'number' && typeof v.last === 'string' ? v : null;
  } catch {
    return null;
  }
}

/** 페이지를 열 때 — 이번 유입처로 기억을 갱신(저장소를 막은 브라우저는 조용히 건너뜀). */
export function rememberSource(current: string): SourceMemory {
  let prev: SourceMemory | null = null;
  try {
    prev = parse(localStorage.getItem(KEY));
  } catch {
    // 저장소 차단
  }
  const next = nextSourceMemory(prev, current, Date.now());
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장소 차단 — 이번 페이지에서만 쓴다
  }
  return next;
}

/** 예약 문의를 보낼 때 — 기억한 처음·마지막 유입처(없으면 빈 값). */
export function readSourceMemory(): { sourceFirst?: string; sourceLast?: string } {
  try {
    const m = parse(localStorage.getItem(KEY));
    return m ? { sourceFirst: m.first.s, sourceLast: m.last } : {};
  } catch {
    return {};
  }
}
