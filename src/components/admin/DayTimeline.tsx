'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateScheduledTime } from '@/app/admin/actions';
import StatusControl from './StatusControl';
import EditInquiryButton from './EditInquiryButton';
import { estimateRevenue, tourMeta, type TourPrices } from '@/lib/tour-pricing';
import type { Inquiry, InquiryStatus } from '@/lib/inquiries/types';

const WON = (n: number) => '₩' + n.toLocaleString('ko-KR');
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 ~ 20:00
const hourOf = (t: string) => parseInt(t.split(':')[0], 10);
const slot = (h: number) => `${String(h).padStart(2, '0')}:00`;
const SLOTS = HOURS.map(slot);

function revenueOf(q: Inquiry, prices: TourPrices): number | null {
  const { slug } = tourMeta(q.product);
  return slug ? estimateRevenue(prices, slug, q.people) : null;
}

function TimelineCard({
  q,
  prices,
  onAssign
}: {
  q: Inquiry;
  prices: TourPrices;
  onAssign: (id: string, time: string) => void;
}) {
  const { accent } = tourMeta(q.product);
  const rev = revenueOf(q, prices);
  const cur = q.scheduledTime ?? '';
  // 현재 배정값이 정시 슬롯에 없으면(예: 10:30) 옵션으로 보존
  const opts = cur && !SLOTS.includes(cur) ? [cur, ...SLOTS] : SLOTS;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', q.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="min-w-[160px] flex-1 cursor-grab rounded-lg border border-line bg-surface p-2 shadow-sm active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-xs font-semibold leading-tight text-ink">{q.product || '투어 미정'}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {q.people ? `${q.people}명` : '인원?'}
        {q.time ? ` · 희망 ${q.time}` : ''}
      </p>
      <p className="text-[11px] text-ink">{q.name}</p>
      {rev != null && <p className="text-[11px] font-medium text-emerald-600">{WON(rev)} 예상</p>}

      {/* 시간 배정 — 드롭다운(확실히 작동) */}
      <div className="mt-1.5 flex items-center gap-1">
        <span className="text-[11px] text-muted">배정</span>
        <select
          value={cur}
          onChange={(e) => onAssign(q.id, e.target.value)}
          className="rounded border border-line bg-bg px-1.5 py-1 text-[11px] text-ink focus:border-brand focus:outline-none"
        >
          <option value="">미배정</option>
          {opts.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <StatusControl id={q.id} status={q.status as InquiryStatus} />
        <EditInquiryButton inquiry={q} />
      </div>
    </div>
  );
}

export default function DayTimeline({
  dateKey,
  items,
  prices,
  onClose
}: {
  dateKey: string;
  items: Inquiry[];
  prices: TourPrices;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<Inquiry[]>(items);
  const [, start] = useTransition();

  function assign(id: string, time: string) {
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, scheduledTime: time || undefined } : c)));
    start(async () => {
      try {
        await updateScheduledTime(id, time);
      } catch {
        setCards(prev);
        alert('시각 저장에 실패했습니다.');
      }
    });
  }

  const drop = (time: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) assign(id, time);
    }
  });

  const unscheduled = cards.filter((c) => !c.scheduledTime);
  const bySlot = useMemo(() => {
    const m = new Map<number, Inquiry[]>();
    for (const c of cards) {
      if (!c.scheduledTime) continue;
      const h = hourOf(c.scheduledTime);
      (m.get(h) ?? m.set(h, []).get(h)!).push(c);
    }
    return m;
  }, [cards]);

  const [y, mo, d] = dateKey.split('-').map(Number);
  const dayLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(y, mo - 1, d));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-4 w-full max-w-2xl rounded-card border border-line bg-bg shadow-hover"
      >
        <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{dayLabel} · 하루 상세</h2>
            <p className="text-xs text-muted">
              카드의 <strong>배정 드롭다운</strong>으로 시간을 정하세요(드래그도 가능). 같은 시간에
              겹치면 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-button border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-4">
          {/* 시간 미배정 */}
          <div
            {...drop('')}
            className="mb-4 rounded-card border border-dashed border-line bg-surface/50 p-3"
          >
            <p className="mb-2 text-xs font-semibold text-muted">시간 미배정 ({unscheduled.length})</p>
            {unscheduled.length === 0 ? (
              <p className="text-xs text-muted/60">모두 배정됨</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unscheduled.map((q) => (
                  <TimelineCard key={q.id} q={q} prices={prices} onAssign={assign} />
                ))}
              </div>
            )}
          </div>

          {/* 시간 슬롯 */}
          <div className="divide-y divide-line rounded-card border border-line">
            {HOURS.map((h) => {
              const slotCards = bySlot.get(h) ?? [];
              const overlap = slotCards.length >= 2;
              const slotRev = slotCards.reduce((s, q) => s + (revenueOf(q, prices) ?? 0), 0);
              return (
                <div key={h} {...drop(slot(h))} className={`flex gap-3 px-3 py-2 ${overlap ? 'bg-amber-50' : ''}`}>
                  <div className="w-12 shrink-0 pt-1 text-xs font-medium text-muted">{slot(h)}</div>
                  <div className="flex-1">
                    {slotCards.length === 0 ? (
                      <div className="py-2 text-[11px] text-muted/40">—</div>
                    ) : (
                      <>
                        {overlap && (
                          <p className="mb-1 text-[11px] font-semibold text-amber-700">
                            ⚠ 겹침 {slotCards.length}건 · 합계 예상 {WON(slotRev)} — 조율 필요
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {slotCards.map((q) => (
                            <TimelineCard key={q.id} q={q} prices={prices} onAssign={assign} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
