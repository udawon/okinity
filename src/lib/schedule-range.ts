/**
 * 일정 항목의 모델·기간 전개 유틸 — 서버/클라 공용(순수, fs 의존 없음).
 * 종료일(endDate)이 있으면 시작~종료의 모든 날짜를, 없으면 단일 날짜를 반환.
 */

// 일정 구분 — 달력에서 색으로 구분되고, 입력한 텍스트(program)가 그대로 표시된다.
//   tour    투어·프로그램(파랑) — 일반 일정
//   special 특별 일정(노랑) — 전세투어·이벤트 등 강조 표시
//   blocked 예약 불가(빨강) — 휴무·출장 등. 해당 날짜는 예약 선택 차단
export type ScheduleStatus = 'tour' | 'special' | 'blocked';

export type ScheduleItem = {
  date: string; // 시작일(ISO YYYY-MM-DD)
  endDate?: string; // 종료일(기간 지정 시). 없으면 단일 날짜.
  program: string; // 달력에 입력한 그대로 표시되는 텍스트
  status: ScheduleStatus;
};

// 과거 저장분(available/full/closed/booked/morning/afternoon) 호환 매핑.
// closed→blocked(예약 불가), full→special(강조), 그 외→tour.
const LEGACY_STATUS: Record<string, ScheduleStatus> = {
  tour: 'tour',
  special: 'special',
  blocked: 'blocked',
  available: 'tour',
  booked: 'tour',
  full: 'special',
  morning: 'tour',
  afternoon: 'tour',
  closed: 'blocked'
};

const isISO = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}/.test(s);

/**
 * 저장 데이터(신·구 포맷 혼재 가능)를 현재 모델로 정규화.
 * 날짜가 없거나 표시할 텍스트가 없는 항목은 제외(blocked는 '휴무'로 보완).
 */
export function normalizeScheduleItems(raw: unknown): ScheduleItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ScheduleItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if (typeof o.date !== 'string' || !isISO(o.date)) continue;
    const date = o.date.slice(0, 10);
    const status = LEGACY_STATUS[typeof o.status === 'string' ? o.status : ''] ?? 'tour';
    const program =
      (typeof o.program === 'string' ? o.program.trim() : '') ||
      (status === 'blocked' ? '휴무' : '');
    if (!program) continue; // 구버전 '오전만/오후만' 등 라벨 없는 항목은 표시 불가 → 제외
    const endDate =
      typeof o.endDate === 'string' && isISO(o.endDate) && o.endDate.slice(0, 10) > date
        ? o.endDate.slice(0, 10)
        : undefined;
    out.push({ date, endDate, program, status });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

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

/** blocked(예약 불가) 항목이 덮는 날짜 → 입력 원문 라벨. (운영 보드 등에서 사용) */
export function blockedDateLabels(items: ScheduleItem[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const it of items) {
    if (it.status !== 'blocked') continue;
    for (const d of scheduleItemDates(it)) if (!(d in m)) m[d] = it.program;
  }
  return m;
}
