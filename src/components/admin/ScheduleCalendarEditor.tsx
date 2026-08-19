'use client';

import { useMemo, useState } from 'react';
import type { ScheduleItem, ScheduleStatus } from '@/lib/content';
import { scheduleItemDates } from '@/lib/schedule-range';

// 구분 3종 — 달력 칩·선택지 공용(목록 보기와 공유). 색은 공개 달력과 동일 계열.
export const KIND_OPTS: { value: ScheduleStatus; label: string; swatch: string }[] = [
  { value: 'tour', label: '투어·프로그램', swatch: '#5fc6ef' },
  { value: 'special', label: '특별 일정', swatch: '#e8b34c' },
  { value: 'blocked', label: '예약 불가 (휴무·출장 등)', swatch: '#e05b6f' }
];

export const inputCls =
  'rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

const WD = ['일', '월', '화', '수', '목', '금', '토'];

// new Date('YYYY-MM-DD')는 UTC로 파싱되어 로컬에서 하루 밀릴 수 있음 → y/m/d 수동 조합으로 키 생성.
const dateKey = (y: number, m0: number, d: number) =>
  `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// 오늘 키는 운영지(오키나와, JST) 시간대로 고정 — 서버(Vercel, UTC)와 어드민 브라우저(KST,
// JST와 같은 UTC+9)가 항상 같은 '오늘'을 계산하므로 SSR/하이드레이션 불일치가 생기지 않는다.
const todayKeyOf = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());

// 'YYYY-MM-DD' → '2026년 8월 22일 (토)' — 문자열 수동 분해(UTC 밀림 방지).
function formatKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일 (${WD[new Date(y, m - 1, d).getDay()]})`;
}

const swatchOf = (s: ScheduleStatus) =>
  (KIND_OPTS.find((o) => o.value === s) ?? KIND_OPTS[0]).swatch;

/**
 * 어드민 일정 월 캘린더 편집기 — 날짜 칸 클릭 → 우측(좁은 화면은 아래) 패널에서
 * 그 날짜를 덮는 일정을 인라인 수정·삭제·추가한다. 상태는 부모(ScheduleForm)가 소유.
 */
export default function ScheduleCalendarEditor({
  items,
  disabled = false,
  onPatch,
  onRemove,
  onAdd
}: {
  items: ScheduleItem[];
  disabled?: boolean;
  onPatch: (index: number, patch: Partial<ScheduleItem>) => void;
  onRemove: (index: number) => void;
  onAdd: (item: ScheduleItem) => void;
}) {
  const todayKey = todayKeyOf();
  const [ty, tm] = todayKey.split('-').map(Number);
  const [{ y, m }, setYm] = useState({ y: ty, m: tm - 1 }); // m: 0-based
  const [selected, setSelected] = useState<string | null>(null);
  // "이 날짜에 추가" 폼 초안 — 날짜를 바꿔 선택하면 초기화된다.
  const [draft, setDraft] = useState({ program: '', status: 'tour' as ScheduleStatus, endDate: '' });

  // 날짜 → 그 날짜를 덮는 항목 인덱스(기간 항목은 scheduleItemDates로 전 날짜 전개)
  const byDate = useMemo(() => {
    const map = new Map<string, number[]>();
    items.forEach((it, i) => {
      for (const key of scheduleItemDates(it)) {
        (map.get(key) ?? map.set(key, []).get(key)!).push(i);
      }
    });
    return map;
  }, [items]);

  const monthTitle = `${y}년 ${m + 1}월`;
  const firstWeekday = new Date(y, m, 1).getDay(); // 0=일
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  // 말일 이후도 빈 칸으로 채워 마지막 주의 잔여 영역이 컨테이너 배경(bg-line)으로 노출되지 않게 한다.
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const select = (key: string) => {
    setSelected(key);
    setDraft({ program: '', status: 'tour', endDate: '' });
  };

  // 편집 중 항목의 날짜가 바뀌어 더 이상 선택 날짜를 덮지 않으면 선택(과 표시 월)이 항목을
  // 따라간다 — 편집 카드가 패널에서 갑자기 사라져 편집 흐름이 끊기는 것을 방지.
  const follow = (key: string) => {
    setSelected(key);
    const [fy, fm] = key.split('-').map(Number);
    setYm({ y: fy, m: fm - 1 });
  };

  // 추가 — 내용이 비면 예약 불가만 허용(저장 시 '휴무'로 보완되는 규칙과 동일).
  const canAdd = !disabled && !!selected && (!!draft.program.trim() || draft.status === 'blocked');
  const addAt = () => {
    if (!canAdd || !selected) return;
    onAdd({
      date: selected,
      endDate: draft.endDate && draft.endDate > selected ? draft.endDate : undefined,
      program: draft.program,
      status: draft.status
    });
    setDraft({ program: '', status: 'tour', endDate: '' });
  };

  const covering = selected ? (byDate.get(selected) ?? []) : [];
  // 시작일이 없어 캘린더에 표시할 수 없는 항목 수 — 목록 보기의 '+ 일정 추가'로 생긴 빈 행 등.
  // 저장 시 조용히 제외되는 항목이므로 캘린더 보기에서도 존재를 알려준다.
  const datelessCount = items.reduce(
    (n, it) => n + (scheduleItemDates(it).length === 0 ? 1 : 0),
    0
  );
  const navBtn = 'rounded-button border border-line px-3 py-1.5 text-sm text-muted hover:text-ink';

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* 캘린더 */}
      <div>
        {/* 월 네비 */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className={navBtn}>
            ‹ 이전 달
          </button>
          <button
            type="button"
            onClick={() => setYm({ y: ty, m: tm - 1 })}
            className={navBtn}
          >
            오늘
          </button>
          <button type="button" onClick={() => shift(1)} className={navBtn}>
            다음 달 ›
          </button>
          <span className="ml-1 text-base font-semibold text-ink">{monthTitle}</span>
        </div>

        {/* 요일 헤더 */}
        <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-muted">
          {WD.map((w, i) => (
            <div key={i} className={`py-1.5 ${i === 0 ? 'text-rose-500' : ''}`}>
              {w}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-card border border-line bg-line">
          {cells.map((day, i) => {
            if (day === null)
              return <div key={i} className="min-h-[84px] bg-bg/30 sm:min-h-[104px]" />;
            const key = dateKey(y, m, day);
            const idxs = byDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                type="button"
                onClick={() => select(key)}
                aria-pressed={isSelected}
                className={`min-h-[84px] cursor-pointer p-1.5 text-left align-top transition-colors sm:min-h-[104px] ${
                  isSelected
                    ? 'bg-brand-light ring-2 ring-inset ring-brand'
                    : 'bg-surface hover:bg-bg/60'
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    isToday ? 'bg-brand font-semibold text-brand-contrast' : 'text-ink'
                  }`}
                >
                  {day}
                </span>
                <span className="mt-1 block space-y-0.5">
                  {idxs.slice(0, 3).map((idx) => {
                    const it = items[idx];
                    const sw = swatchOf(it.status);
                    return (
                      <span
                        key={idx}
                        title={it.program}
                        className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-ink"
                        style={{ backgroundColor: `${sw}26`, borderLeft: `3px solid ${sw}` }}
                      >
                        {it.program || '휴무'}
                      </span>
                    );
                  })}
                  {idxs.length > 3 && (
                    <span className="block text-[10px] text-muted">+{idxs.length - 3}건</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {KIND_OPTS.map((o) => (
            <span key={o.value} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: o.swatch }}
              />
              {o.label}
            </span>
          ))}
        </div>

        {/* 시작일 없는 항목 경고 — 캘린더에 안 보인 채 저장 시 제외되는 것을 인지시킨다 */}
        {datelessCount > 0 && (
          <p className="mt-2 text-xs text-amber-600">
            시작일이 없는 항목 {datelessCount}건은 캘린더에 표시되지 않으며 저장 시 제외됩니다.
            목록 보기에서 확인하세요.
          </p>
        )}
      </div>

      {/* 편집 패널 — 데스크톱 우측, 좁은 화면은 아래 */}
      <div className="rounded-card border border-line bg-surface p-4">
        {!selected ? (
          <p className="text-sm text-muted">
            날짜를 클릭하면 그 날짜의 일정을 추가·수정할 수 있습니다.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink">{formatKey(selected)}</p>

            {/* 이 날짜를 덮는 기존 일정 */}
            {covering.length === 0 ? (
              <p className="text-sm text-muted">이 날짜에 등록된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {covering.map((idx) => {
                  const it = items[idx];
                  return (
                    <div key={idx} className="space-y-2 rounded-card border border-line bg-bg/40 p-3">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: swatchOf(it.status) }}
                        />
                        <select
                          aria-label="구분"
                          value={it.status}
                          onChange={(e) =>
                            onPatch(idx, { status: e.target.value as ScheduleStatus })
                          }
                          disabled={disabled}
                          className={`${inputCls} app-select app-select-light min-w-0 flex-1`}
                        >
                          {KIND_OPTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onRemove(idx)}
                          disabled={disabled}
                          className="shrink-0 text-sm text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                      <input
                        value={it.program}
                        onChange={(e) => onPatch(idx, { program: e.target.value })}
                        placeholder="달력에 그대로 표시됩니다 (예: 케라마 전세투어)"
                        disabled={disabled}
                        className={`${inputCls} w-full`}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          aria-label="시작일"
                          value={it.date.slice(0, 10)}
                          onChange={(e) => {
                            const v = e.target.value;
                            // 빈 값(브라우저 clear)은 무시 — 시작일이 비면 캘린더 어디에도
                            // 보이지 않게 되고 저장 시 조용히 제외되기 때문(silent 삭제 방지).
                            if (!v) return;
                            onPatch(idx, { date: v });
                            if (!scheduleItemDates({ date: v, endDate: it.endDate }).includes(selected))
                              follow(v);
                          }}
                          disabled={disabled}
                          className={`${inputCls} w-36`}
                        />
                        <span className="text-sm text-muted">~</span>
                        <input
                          type="date"
                          aria-label="종료일(선택)"
                          min={it.date.slice(0, 10) || undefined}
                          value={it.endDate?.slice(0, 10) ?? ''}
                          onChange={(e) => {
                            const v = e.target.value || undefined;
                            onPatch(idx, { endDate: v });
                            // 종료일 변경으로 선택 날짜를 벗어나면 시작일로 따라간다(카드 유지).
                            if (!scheduleItemDates({ date: it.date, endDate: v }).includes(selected))
                              follow(it.date);
                          }}
                          disabled={disabled}
                          className={`${inputCls} w-36`}
                          title="기간 일정은 종료일을 지정하세요(단일 날짜는 비워두세요)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 이 날짜에 추가 */}
            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-xs font-semibold text-muted">이 날짜에 추가</p>
              <input
                value={draft.program}
                onChange={(e) => setDraft((d) => ({ ...d, program: e.target.value }))}
                placeholder="내용 (예: 케라마 전세투어 · 예약 불가는 비워도 됨)"
                disabled={disabled}
                className={`${inputCls} w-full`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="구분"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, status: e.target.value as ScheduleStatus }))
                  }
                  disabled={disabled}
                  className={`${inputCls} app-select app-select-light min-w-0 flex-1`}
                >
                  {KIND_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  aria-label="종료일(선택)"
                  min={selected}
                  value={draft.endDate}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                  disabled={disabled}
                  className={`${inputCls} w-36`}
                  title="기간 일정으로 만들려면 종료일을 지정하세요"
                />
              </div>
              <button
                type="button"
                onClick={addAt}
                disabled={!canAdd}
                className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
              >
                + 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
