'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import DayTimeline from './DayTimeline';
import { updateInquiry } from '@/app/admin/actions';
import { estimateRevenue, tourMeta, type TourPrices } from '@/lib/tour-pricing';
import type { Inquiry } from '@/lib/inquiries/types';

const WON = (n: number) => '₩' + n.toLocaleString('ko-KR');
const WD = ['일', '월', '화', '수', '목', '금', '토'];

const dateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const byTime = (a: Inquiry, b: Inquiry) =>
  (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99');

/** 상태별 칩 텍스트 색(취소·완료는 흐리게/취소선). */
const CHIP: Record<string, string> = {
  tentative: 'text-amber-700',
  confirmed: 'text-ink',
  done: 'text-muted line-through',
  canceled: 'text-muted/50 line-through'
};

function revenueOf(q: Inquiry, prices: TourPrices): number | null {
  const { slug } = tourMeta(q.product);
  return slug ? estimateRevenue(prices, slug, q.people) : null;
}

function Chip({ q }: { q: Inquiry }) {
  const { accent } = tourMeta(q.product);
  const cat = (q.product || '예약').split(' · ')[0];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', q.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      title={`${q.name} · ${q.product || ''}${q.scheduledTime ? ' · ' + q.scheduledTime : ''}`}
      className={`flex cursor-grab items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] leading-tight active:cursor-grabbing ${CHIP[q.status] ?? 'text-ink'}`}
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      {q.scheduledTime && <span className="font-semibold">{q.scheduledTime}</span>}
      <span className="truncate">{cat}</span>
    </div>
  );
}

export default function MonthBoard({
  inquiries,
  prices,
  todayKey,
  closedDates
}: {
  inquiries: Inquiry[];
  prices: TourPrices;
  todayKey: string;
  closedDates: string[];
}) {
  const [ty, tm] = todayKey.split('-').map(Number);
  const [ym, setYm] = useState({ y: ty, m: tm - 1 }); // m: 0-based
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [, startMove] = useTransition();
  const router = useRouter();

  const closed = useMemo(() => new Set(closedDates), [closedDates]);

  const byDate = useMemo(() => {
    const map = new Map<string, Inquiry[]>();
    for (const q of inquiries) {
      const key =
        typeof q.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(q.date) ? q.date.slice(0, 10) : null;
      if (!key) continue;
      (map.get(key) ?? map.set(key, []).get(key)!).push(q);
    }
    return map;
  }, [inquiries]);

  const undated = useMemo(
    () => inquiries.filter((q) => !(typeof q.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(q.date))),
    [inquiries]
  );

  function moveToDate(id: string, date: string) {
    const q = inquiries.find((x) => x.id === id);
    if (!q || q.date === date) return;
    startMove(async () => {
      try {
        await updateInquiry(id, {
          product: q.product,
          date,
          time: q.time,
          people: q.people,
          name: q.name,
          contact: q.contact,
          message: q.message
        });
        router.refresh();
      } catch {
        alert('날짜 변경에 실패했습니다.');
      }
    });
  }

  const { y, m } = ym;
  const monthTitle = `${y}년 ${m + 1}월`;
  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  const shift = (delta: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  // 이번 달 예상매출(취소·완료 제외)
  const monthRevenue = useMemo(() => {
    let sum = 0;
    for (const [key, list] of byDate) {
      if (!key.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)) continue;
      for (const q of list) {
        if (q.status === 'canceled' || q.status === 'done') continue;
        const r = revenueOf(q, prices);
        if (r) sum += r;
      }
    }
    return sum;
  }, [byDate, prices, y, m]);

  const btn = 'rounded-button border border-line px-3 py-1.5 text-sm text-muted hover:text-ink';

  return (
    <div>
      {/* 월 네비 */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => shift(-1)} className={btn}>
          ‹ 이전 달
        </button>
        <button type="button" onClick={() => setYm({ y: ty, m: tm - 1 })} className={btn}>
          이번 달
        </button>
        <button type="button" onClick={() => shift(1)} className={btn}>
          다음 달 ›
        </button>
        <span className="ml-1 text-base font-semibold text-ink">{monthTitle}</span>
        {monthRevenue > 0 && (
          <span className="ml-auto text-sm text-muted">
            이달 예상매출 <strong className="text-emerald-600">{WON(monthRevenue)}</strong>
          </span>
        )}
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
          if (day === null) return <div key={i} className="min-h-[92px] bg-bg/30 sm:min-h-[112px]" />;
          const key = dateKey(y, m, day);
          const items = (byDate.get(key) ?? []).slice().sort(byTime);
          const isToday = key === todayKey;
          const isClosed = closed.has(key);
          return (
            <div
              key={i}
              onClick={() => setOpenDay(key)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverKey !== key) setDragOverKey(key);
              }}
              onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverKey(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id) moveToDate(id, key);
              }}
              className={`min-h-[92px] cursor-pointer p-1.5 transition-colors sm:min-h-[112px] ${
                dragOverKey === key
                  ? 'bg-brand-light ring-2 ring-inset ring-brand/50'
                  : isClosed
                    ? 'bg-rose-50 hover:bg-rose-100'
                    : 'bg-surface hover:bg-bg/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    isToday ? 'bg-brand font-semibold text-brand-contrast' : 'text-ink'
                  }`}
                >
                  {day}
                </span>
                {items.length > 0 && <span className="text-[10px] text-muted">{items.length}</span>}
              </div>

              {isClosed && (
                <span className="mt-1 inline-block rounded bg-rose-100 px-1 py-0.5 text-[10px] font-bold text-rose-600">
                  🚫 휴무
                </span>
              )}

              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((q) => (
                  <Chip key={q.id} q={q} />
                ))}
                {items.length > 3 && (
                  <p className="text-[10px] text-muted">+{items.length - 3}건</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted">
        날짜 클릭 → 하루 상세(시간 배치·수정·겹침) · 칩을 다른 날짜로 끌어 날짜 변경
      </p>

      {/* 날짜 미정 */}
      {undated.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">날짜 미정 ({undated.length})</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {undated.map((q) => (
              <span
                key={q.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', q.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                title="날짜 칸으로 끌어 날짜 지정"
                className="cursor-grab rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink shadow-sm active:cursor-grabbing"
                style={{ borderLeft: `3px solid ${tourMeta(q.product).accent}` }}
              >
                {q.name} · {(q.product || '예약').split(' · ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {openDay && (
        <DayTimeline
          dateKey={openDay}
          items={byDate.get(openDay) ?? []}
          prices={prices}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  );
}
