'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ScheduleItem } from '@/lib/content';
import { scheduleItemDates } from '@/lib/schedule-range';

type Status = ScheduleItem['status'];

// 구분별 색 — 입력한 텍스트(program)가 이 색으로 그대로 표시된다.
// blocked(예약 불가)는 점 대신 붉은 막대로 렌더링(아래 참조).
const KIND: Record<Status, { text: string; dot: string }> = {
  tour: { text: 'text-[#5fc6ef]', dot: 'bg-[#5fc6ef]' }, // 투어·프로그램 — 브랜드 블루
  special: { text: 'text-[#f2c879]', dot: 'bg-[#f2c879]' }, // 특별 일정 — 앰버
  blocked: { text: 'text-rose-200', dot: 'bg-rose-300/80' } // 예약 불가(휴무·출장 등) — 로즈
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
  selectable = false,
  selectedKey = null,
  onSelectDate
}: {
  items: ScheduleItem[];
  locale: string;
  statusLabel: Record<Status, string>;
  /** true면 예약가능 날짜를 클릭할 수 있다(예약 통합용). 미지정 시 읽기전용(기존 동작). */
  selectable?: boolean;
  /** 현재 선택된 날짜 키(YYYY-MM-DD). */
  selectedKey?: string | null;
  onSelectDate?: (key: string, events: ScheduleItem[]) => void;
}) {
  const t = useTranslations('reservation');

  // EN/JA 표시 라벨 — 운영자 일정 텍스트(program)는 한국어 단일 입력이라, 한글이 포함된
  // 텍스트는 비한국어 로케일에서 상태별 번역 라벨(statusLabel)로 대체한다. "태풍 휴무" 같은
  // 안전·운영 정보가 외국인에게 전달되지 않던 문제 해결(2026-07-22 QA ISSUE-001).
  // 운영자가 영문 등 비한글로 입력하면 그대로 노출된다.
  const hasHangul = /[가-힣]/;
  const displayLabel = (e: ScheduleItem) =>
    locale !== 'ko' && hasHangul.test(e.program) ? statusLabel[e.status] : e.program;

  // 날짜별 이벤트 맵 — 기간 항목(endDate)은 모든 날짜로 전개.
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      for (const key of scheduleItemDates(it)) {
        (map.get(key) ?? map.set(key, []).get(key)!).push(it);
      }
    }
    return map;
  }, [items]);

  // 예약 불가(blocked) 날짜 집합 — 연속 구간 표시(구간 시작에만 라벨)용.
  const blockedSet = useMemo(() => {
    const s = new Set<string>();
    for (const [k, evs] of byDate) if (evs.some((e) => e.status === 'blocked')) s.add(k);
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

  // 초기 월 = 오늘의 월 — 시간이 흐르면 달력도 자연히 따라간다(과거 일정 월로 고정 금지).
  const [{ y, m }, setYM] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

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

  const navBtn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white';

  // 예약 불가(blocked)·과거만 예약 불가. 프로그램이 있어도 하루 2회+ 투어 여지가 있어 선택 가능.
  const pick = (key: string, evs: ScheduleItem[]) => {
    if (selectable && onSelectDate && !evs.some((e) => e.status === 'blocked') && key >= todayKey) {
      onSelectDate(key, evs);
    }
  };

  return (
    <div>
      {/* 헤더: 월 이동 */}
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t('prevMonth')} onClick={() => shift(-1)} className={navBtn}>
          ‹
        </button>
        <h2 className="font-serif text-2xl text-white sm:text-3xl">{monthTitle}</h2>
        <button type="button" aria-label={t('nextMonth')} onClick={() => shift(1)} className={navBtn}>
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
            return <div key={i} className="min-h-[72px] bg-[#061522]/70 sm:min-h-[96px]" />;
          }
          const key = dateKey(day);
          const evs = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = selectedKey === key;
          // 예약 불가(blocked) 또는 과거만 차단. 프로그램이 있어도 다른 투어 예약 여지가 있으므로 선택 가능.
          const blockedEvs = evs.filter((e) => e.status === 'blocked');
          const hasBlocked = blockedEvs.length > 0;
          const canBook = selectable && !hasBlocked && key >= todayKey;
          // 연속 예약 불가: 구간 전체를 가로지르는 막대로 표시.
          // 라벨은 각 항목의 시작일마다(장기출장→휴무처럼 이어져도 각각 원문 표기), 막대는 이어짐.
          const isBlockedRunStart = hasBlocked && !blockedSet.has(prevKey(key));
          const isBlockedRunEnd = hasBlocked && !blockedSet.has(nextKey(key));
          const startingBlocked =
            blockedEvs.find((e) => e.date === key) ?? (isBlockedRunStart ? blockedEvs[0] : undefined);
          const col = i % 7; // 0=일 … 6=토 — 주 경계에서도 모서리 둥글게
          const roundL = isBlockedRunStart || col === 0;
          const roundR = isBlockedRunEnd || col === 6;
          const blockedRound =
            roundL && roundR ? 'rounded-md' : roundL ? 'rounded-l-md' : roundR ? 'rounded-r-md' : '';
          const nonBlocked = evs.filter((e) => e.status !== 'blocked');

          const dayNum = (
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? 'bg-brand font-semibold text-brand-contrast' : 'text-white/70'
              }`}
            >
              {day}
            </span>
          );

          const eventList = (hasBlocked || nonBlocked.length > 0) && (
            <div className="mt-1 space-y-1">
              {hasBlocked && (
                // 셀 좌우 패딩을 음수마진으로 뚫어 칸 끝까지 → 연속 구간이 막대로 이어져 보임
                <div
                  className={`-mx-1.5 truncate bg-rose-400/20 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-rose-100 sm:-mx-2 sm:text-[11px] ${blockedRound}`}
                  title={startingBlocked ? displayLabel(startingBlocked) : undefined}
                >
                  {startingBlocked ? (
                    <>
                      <span className="hidden sm:inline">🚫 </span>
                      {displayLabel(startingBlocked)}
                    </>
                  ) : (
                    ' '
                  )}
                </div>
              )}
              {nonBlocked.map((e, j) => (
                <div key={j} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND[e.status].dot}`} />
                  <span
                    className={`truncate text-[10px] leading-tight sm:text-[11px] ${KIND[e.status].text}`}
                    title={displayLabel(e)}
                  >
                    {displayLabel(e)}
                  </span>
                </div>
              ))}
            </div>
          );

          // 모든 칸을 상단 정렬(flex-col) — button/div 혼용 시 세로 정렬이 달라지는 문제 방지.
          // 예약 불가는 셀 배경도 붉은 톤으로 구분해 한눈에 보이게.
          const base = `flex min-h-[72px] flex-col p-1.5 text-left sm:min-h-[96px] sm:p-2 ${
            hasBlocked ? 'bg-rose-950/30' : evs.length ? 'bg-[#0e2c46]/80' : 'bg-[#061522]/70'
          }`;

          // 예약 가능(예약 불가·과거 제외) → 클릭. 빈 날짜는 '+예약' 힌트, 프로그램 날짜는 일정 표시 + 호버 강조.
          if (canBook) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(key, evs)}
                aria-pressed={isSelected}
                className={`group ${base} w-full cursor-pointer transition-colors hover:bg-[#155084]/70 ${
                  isSelected ? 'bg-[#155084]/60 ring-2 ring-inset ring-[#5fc6ef]' : ''
                }`}
              >
                {dayNum}
                {eventList}
                {evs.length === 0 && (
                  <span
                    className={`mt-2 block text-[10px] font-medium text-[#5fc6ef] transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {t('addBook')}
                  </span>
                )}
              </button>
            );
          }

          // 예약 불가(blocked) 또는 과거 → 클릭 불가(정보 표시)
          return (
            <div key={i} className={base}>
              {dayNum}
              {eventList}
            </div>
          );
        })}
      </div>

      {/* 범례 — 구분 3종(투어·프로그램/특별 일정/예약 불가). 텍스트는 입력한 그대로 표시된다. */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
        {(['tour', 'special', 'blocked'] as Status[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${KIND[s].dot}`} />
            {statusLabel[s]}
          </span>
        ))}
        {selectable && (
          <span className="text-white/45">{t('legendHint')}</span>
        )}
      </div>
    </div>
  );
}
