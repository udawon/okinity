'use client';

import { useMemo, useState } from 'react';
import type { ScheduleItem } from '@/lib/content';
import { scheduleItemDates } from '@/lib/schedule-range';

type Status = ScheduleItem['status'];

const STATUS: Record<Status, { text: string; dot: string }> = {
  available: { text: 'text-[#5fd6e2]', dot: 'bg-[#5fd6e2]' },
  booked: { text: 'text-[#5fd6e2]', dot: 'bg-[#5fd6e2]' }, // 확정 1건 — 터콰이즈
  full: { text: 'text-[#f2c879]', dot: 'bg-[#f2c879]' }, // 예약많음/확정 2건+ — 베이지
  closed: { text: 'text-rose-200', dot: 'bg-rose-300/80' },
  morning: { text: 'text-sky-300', dot: 'bg-sky-300' }, // 오전만 가능
  afternoon: { text: 'text-violet-300', dot: 'bg-violet-300' } // 오후만 가능
};

/** 셀에 표시할 텍스트 — morning/afternoon은 안내 문구로 자동 표기. */
function eventLabel(e: { status: Status; program: string }): string {
  if (e.status === 'morning') return '오전만 가능';
  if (e.status === 'afternoon') return '오후만 가능';
  return e.program;
}

// 2024-01-07은 일요일 → 요일 헤더(로케일별)를 일요일 시작으로 생성
const weekdayLabels = (locale: string) =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  );

const ymKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

export default function ScheduleCalendar({
  items,
  locale,
  statusLabel,
  emptyLabel,
  selectable = false,
  selectedKey = null,
  onSelectDate
}: {
  items: ScheduleItem[];
  locale: string;
  statusLabel: Record<Status, string>;
  emptyLabel: string;
  /** true면 예약가능 날짜를 클릭할 수 있다(예약 통합용). 미지정 시 읽기전용(기존 동작). */
  selectable?: boolean;
  /** 현재 선택된 날짜 키(YYYY-MM-DD). */
  selectedKey?: string | null;
  onSelectDate?: (key: string, events: ScheduleItem[]) => void;
}) {
  // 날짜별 이벤트 맵 — 기간 항목(endDate)은 모든 날짜로 전개. 표시용 문자열만 있는 항목은 제외.
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      for (const key of scheduleItemDates(it)) {
        (map.get(key) ?? map.set(key, []).get(key)!).push(it);
      }
    }
    return map;
  }, [items]);

  // 휴무 날짜 집합 — 연속 휴무 표시(연속 구간 시작에만 라벨)용.
  const closedSet = useMemo(() => {
    const s = new Set<string>();
    for (const [k, evs] of byDate) if (evs.some((e) => e.status === 'closed')) s.add(k);
    return s;
  }, [byDate]);

  const shiftKey = (key: string, delta: number) => {
    const [yy, mm, dd] = key.split('-').map(Number);
    const dt = new Date(yy, mm - 1, dd);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
      dt.getDate()
    ).padStart(2, '0')}`;
  };
  const prevKey = (key: string) => shiftKey(key, -1);
  const nextKey = (key: string) => shiftKey(key, 1);

  // 초기 월 = 가장 이른 일정의 월(없으면 오늘)
  const initial = useMemo(() => {
    const first = [...byDate.keys()].sort()[0];
    const d = first ? new Date(first) : new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  }, [byDate]);

  const [{ y, m }, setYM] = useState(initial);

  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const monthTitle = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long'
  }).format(new Date(y, m, 1));

  const firstWeekday = new Date(y, m, 1).getDay(); // 0=일
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(
      t.getDate()
    ).padStart(2, '0')}`;
  })();

  // 그리드 셀: 앞쪽 빈칸 + 1..말일
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const dateKey = (day: number) => ymKey(y, m) + '-' + String(day).padStart(2, '0');

  const shift = (delta: number) => {
    const d = new Date(y, m + delta, 1);
    setYM({ y: d.getFullYear(), m: d.getMonth() });
  };

  // 해당 월의 이벤트 리스트 — 원본 항목 기준(기간 항목은 한 번만, 구간 표기). 정렬: 시작일.
  const monthPrefix = ymKey(y, m);
  const monthEvents = items
    .filter((it) => scheduleItemDates(it).some((d) => d.startsWith(monthPrefix)))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const navBtn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white';

  // 휴무(closed)·과거만 예약 불가. 프로그램이 있어도 하루 2회+ 투어 여지가 있어 선택 가능.
  const pick = (key: string, evs: ScheduleItem[]) => {
    if (selectable && onSelectDate && !evs.some((e) => e.status === 'closed') && key >= todayKey) {
      onSelectDate(key, evs);
    }
  };

  return (
    <div>
      {/* 헤더: 월 이동 */}
      <div className="flex items-center justify-between">
        <button type="button" aria-label="이전 달" onClick={() => shift(-1)} className={navBtn}>
          ‹
        </button>
        <h2 className="font-serif text-2xl text-white sm:text-3xl">{monthTitle}</h2>
        <button type="button" aria-label="다음 달" onClick={() => shift(1)} className={navBtn}>
          ›
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mt-6 grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wider text-white/45">
        {weekdays.map((w, i) => (
          <div key={i} className={`py-2 ${i === 0 ? 'text-[#f2a0a0]' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="min-h-[72px] bg-[#06151d]/70 sm:min-h-[96px]" />;
          }
          const key = dateKey(day);
          const evs = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = selectedKey === key;
          // 휴무(closed) 또는 과거만 차단. 프로그램(예약가능/마감)이 있어도 다른 투어 예약 여지가 있으므로 선택 가능.
          const hasClosed = evs.some((e) => e.status === 'closed');
          const canBook = selectable && !hasClosed && key >= todayKey;
          // 연속 휴무: 구간 전체를 가로지르는 막대로 표시. 라벨은 구간 시작에만, 막대는 이어짐.
          const isClosedRunStart = hasClosed && !closedSet.has(prevKey(key));
          const isClosedRunEnd = hasClosed && !closedSet.has(nextKey(key));
          const col = i % 7; // 0=일 … 6=토 — 주 경계에서도 모서리 둥글게
          const roundL = isClosedRunStart || col === 0;
          const roundR = isClosedRunEnd || col === 6;
          const closedRound =
            roundL && roundR ? 'rounded-md' : roundL ? 'rounded-l-md' : roundR ? 'rounded-r-md' : '';
          const nonClosed = evs.filter((e) => e.status !== 'closed');

          const dayNum = (
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? 'bg-brand font-semibold text-brand-contrast' : 'text-white/70'
              }`}
            >
              {day}
            </span>
          );

          const eventList = (hasClosed || nonClosed.length > 0) && (
            <div className="mt-1 space-y-1">
              {hasClosed && (
                // 셀 좌우 패딩을 음수마진으로 뚫어 칸 끝까지 → 연속 휴무가 막대로 이어져 보임
                <div
                  className={`-mx-1.5 truncate bg-rose-400/20 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-rose-100 sm:-mx-2 sm:text-[11px] ${closedRound}`}
                >
                  {isClosedRunStart ? '🚫 휴무' : ' '}
                </div>
              )}
              {nonClosed.map((e, j) => (
                <div key={j} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS[e.status].dot}`} />
                  <span
                    className={`truncate text-[10px] leading-tight sm:text-[11px] ${STATUS[e.status].text}`}
                    title={eventLabel(e)}
                  >
                    {eventLabel(e)}
                  </span>
                </div>
              ))}
            </div>
          );

          // 모든 칸을 상단 정렬(flex-col) — button/div 혼용 시 세로 정렬이 달라지는 문제 방지.
          // 휴무는 셀 배경도 붉은 톤으로 구분해 한눈에 보이게.
          const base = `flex min-h-[72px] flex-col p-1.5 text-left sm:min-h-[96px] sm:p-2 ${
            hasClosed ? 'bg-rose-950/30' : evs.length ? 'bg-[#0e2c3a]/80' : 'bg-[#06151d]/70'
          }`;

          // 예약 가능(휴무·과거 제외) → 클릭. 빈 날짜는 '+예약' 힌트, 프로그램 날짜는 일정 표시 + 호버 강조.
          if (canBook) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(key, evs)}
                aria-pressed={isSelected}
                className={`group ${base} w-full cursor-pointer transition-colors hover:bg-[#15506a]/70 ${
                  isSelected ? 'bg-[#15506a]/60 ring-2 ring-inset ring-[#5fd6e2]' : ''
                }`}
              >
                {dayNum}
                {eventList}
                {evs.length === 0 && (
                  <span
                    className={`mt-2 block text-[10px] font-medium text-[#5fd6e2] transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    + 예약
                  </span>
                )}
              </button>
            );
          }

          // 휴무(closed) 또는 과거 → 클릭 불가(정보 표시)
          return (
            <div key={i} className={base}>
              {dayNum}
              {eventList}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
        {(Object.keys(STATUS) as Status[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
            {statusLabel[s]}
          </span>
        ))}
        {selectable && (
          <span className="text-white/45">· 휴무를 제외한 날짜를 누르면 예약 문의를 시작할 수 있어요</span>
        )}
      </div>

      {/* 해당 월 일정 리스트 (모바일 가독성 보강) */}
      {monthEvents.length === 0 ? (
        <p className="mt-8 text-sm text-white/50">{emptyLabel}</p>
      ) : (
        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {monthEvents.map((e, i) => {
            const fmt = (key: string) =>
              new Intl.DateTimeFormat(locale, {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              }).format(new Date(key));
            const start = e.date.slice(0, 10);
            const end =
              e.endDate && /^\d{4}-\d{2}-\d{2}/.test(e.endDate) && e.endDate.slice(0, 10) > start
                ? e.endDate.slice(0, 10)
                : null;
            const label = end ? `${fmt(start)} ~ ${fmt(end)}` : fmt(start);
            return (
              <li key={i} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="w-40 shrink-0 text-white/55">{label}</span>
                <span className="flex-1 text-white/90">
                  {e.status === 'closed' ? '휴무' : eventLabel(e)}
                </span>
                <span className={`shrink-0 font-medium ${STATUS[e.status].text}`}>
                  {statusLabel[e.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
