'use client';

import { useMemo, useState } from 'react';
import type { ScheduleItem } from '@/lib/content';

type Status = ScheduleItem['status'];

const STATUS: Record<Status, { text: string; dot: string }> = {
  available: { text: 'text-[#5fd6e2]', dot: 'bg-[#5fd6e2]' },
  full: { text: 'text-[#f2c879]', dot: 'bg-[#f2c879]' },
  closed: { text: 'text-white/40 line-through', dot: 'bg-white/30' }
};

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
  // 날짜별 이벤트 맵 (ISO 'YYYY-MM-DD' 기준). 표시용 문자열만 있는 항목은 캘린더에서 제외.
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      if (!/^\d{4}-\d{2}-\d{2}/.test(it.date)) continue;
      const key = it.date.slice(0, 10);
      (map.get(key) ?? map.set(key, []).get(key)!).push(it);
    }
    return map;
  }, [items]);

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

  // 해당 월의 이벤트 리스트(정렬)
  const monthEvents = [...byDate.entries()]
    .filter(([k]) => k.startsWith(ymKey(y, m)))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([k, evs]) => evs.map((e) => ({ key: k, ...e })));

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

          const dayNum = (
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? 'bg-brand font-semibold text-brand-contrast' : 'text-white/70'
              }`}
            >
              {day}
            </span>
          );

          const eventList = evs.length > 0 && (
            <div className="mt-1 space-y-1">
              {evs.map((e, j) => (
                <div key={j} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS[e.status].dot}`} />
                  <span
                    className={`truncate text-[10px] leading-tight sm:text-[11px] ${STATUS[e.status].text}`}
                    title={e.program}
                  >
                    {e.program}
                  </span>
                </div>
              ))}
            </div>
          );

          const base = `min-h-[72px] p-1.5 text-left sm:min-h-[96px] sm:p-2 ${
            evs.length ? 'bg-[#0e2c3a]/80' : 'bg-[#06151d]/70'
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
            const d = new Date(e.key);
            const label = new Intl.DateTimeFormat(locale, {
              month: 'short',
              day: 'numeric',
              weekday: 'short'
            }).format(d);
            return (
              <li key={i} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="w-28 shrink-0 text-white/55">{label}</span>
                <span className="flex-1 text-white/90">{e.program}</span>
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
