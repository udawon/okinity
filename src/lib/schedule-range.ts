/**
 * 일정 항목의 기간 전개 유틸 — 서버/클라 공용(순수, fs 의존 없음).
 * 종료일(endDate)이 있으면 시작~종료의 모든 날짜를, 없으면 단일 날짜를 반환.
 */

const isISO = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}/.test(s);

function addDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`;
}

/** 항목이 덮는 모든 날짜(YYYY-MM-DD). 종료일 없으면 단일. 비정상/역순은 단일로 처리(최대 366일 가드). */
export function scheduleItemDates(it: { date?: string; endDate?: string }): string[] {
  if (!isISO(it.date)) return [];
  const start = it.date.slice(0, 10);
  let end = isISO(it.endDate) ? it.endDate.slice(0, 10) : start;
  if (end < start) end = start;
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard++ < 366) {
    out.push(cur);
    cur = addDay(cur);
  }
  return out;
}

/** closed(휴무) 항목들이 덮는 모든 날짜 집합. (운영 보드 등에서 사용) */
export function closedDateSet(
  items: { date?: string; endDate?: string; status: string }[]
): Set<string> {
  const s = new Set<string>();
  for (const it of items) {
    if (it.status !== 'closed') continue;
    for (const d of scheduleItemDates(it)) s.add(d);
  }
  return s;
}
