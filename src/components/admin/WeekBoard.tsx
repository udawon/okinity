'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import StatusControl from './StatusControl';
import EditInquiryButton from './EditInquiryButton';
import DayTimeline from './DayTimeline';
import { updateInquiry } from '@/app/admin/actions';
import { estimateRevenue, tourMeta, type TourPrices } from '@/lib/tour-pricing';
import type { Inquiry, InquiryStatus } from '@/lib/inquiries/types';

const WON = (n: number) => '₩' + n.toLocaleString('ko-KR');

/** YYYY-MM-DD 문자열 기준 날짜 연산(타임존 무관 — 문자열 컴포넌트로만 계산). */
function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`;
}

/** todayKey가 속한 주의 월요일(+주 오프셋). */
function weekStart(todayKey: string, offset: number): string {
  const [y, m, d] = todayKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=일
  const toMon = (dow + 6) % 7;
  return addDays(todayKey, -toMon + offset * 7);
}

const WD = ['월', '화', '수', '목', '금', '토', '일'];

/** 배정 시각 오름차순(이른 시간 먼저). 미배정은 맨 뒤. */
function byScheduledTime(a: Inquiry, b: Inquiry): number {
  return (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99');
}

function Card({ q, prices }: { q: Inquiry; prices: TourPrices }) {
  const { accent, slug } = tourMeta(q.product);
  const rev = slug ? estimateRevenue(prices, slug, q.people) : null;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', q.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded-lg border border-line bg-surface p-2.5 shadow-sm active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs font-semibold leading-tight text-ink">{q.product || '투어 미정'}</p>
        {q.scheduledTime && (
          <span className="shrink-0 rounded-full bg-brand-light px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark">
            {q.scheduledTime}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {q.people ? `${q.people}명` : '인원 미정'}
        {q.time ? ` · 희망 ${q.time}` : ''}
      </p>
      <p className="text-[11px] text-ink">{q.name}</p>
      {rev != null && <p className="mt-0.5 text-[11px] font-medium text-emerald-600">{WON(rev)} 예상</p>}
      <div className="mt-1.5 flex items-center gap-1.5">
        <StatusControl id={q.id} status={q.status as InquiryStatus} />
        <EditInquiryButton inquiry={q} />
      </div>
    </div>
  );
}

export default function WeekBoard({
  inquiries,
  prices,
  todayKey
}: {
  inquiries: Inquiry[];
  prices: TourPrices;
  todayKey: string;
}) {
  const [offset, setOffset] = useState(0);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [, startMove] = useTransition();
  const router = useRouter();

  // 카드를 다른 날짜 칸으로 드롭 → 예약 날짜 변경(다른 필드는 유지)
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

  // 날짜(YYYY-MM-DD)별 그룹
  const byDate = useMemo(() => {
    const m = new Map<string, Inquiry[]>();
    for (const q of inquiries) {
      const key = typeof q.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(q.date) ? q.date.slice(0, 10) : null;
      if (!key) continue;
      (m.get(key) ?? m.set(key, []).get(key)!).push(q);
    }
    return m;
  }, [inquiries]);

  const undated = useMemo(
    () => inquiries.filter((q) => !(typeof q.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(q.date))),
    [inquiries]
  );

  const start = weekStart(todayKey, offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const rangeLabel = `${start.slice(5).replace('-', '/')} ~ ${days[6].slice(5).replace('-', '/')}`;

  // 활성 예약(취소·완료 제외)만 매출 합산
  const weekRevenue = days.reduce((sum, key) => {
    for (const q of byDate.get(key) ?? []) {
      if (q.status === 'canceled' || q.status === 'done') continue;
      const { slug } = tourMeta(q.product);
      const r = slug ? estimateRevenue(prices, slug, q.people) : null;
      if (r) sum += r;
    }
    return sum;
  }, 0);

  const btn = 'rounded-button border border-line px-3 py-1.5 text-sm text-muted hover:text-ink';

  return (
    <div>
      {/* 주 네비 */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOffset((o) => o - 1)} className={btn}>
          ‹ 이전 주
        </button>
        <button type="button" onClick={() => setOffset(0)} className={btn}>
          이번 주
        </button>
        <button type="button" onClick={() => setOffset((o) => o + 1)} className={btn}>
          다음 주 ›
        </button>
        <span className="ml-1 text-sm font-medium text-ink">{rangeLabel}</span>
        {weekRevenue > 0 && (
          <span className="ml-auto text-sm text-muted">
            주간 예상매출 <strong className="text-emerald-600">{WON(weekRevenue)}</strong>
          </span>
        )}
      </div>

      {/* 7일 보드 */}
      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 gap-2">
          {days.map((key, i) => {
            const items = byDate.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
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
                className={`rounded-card border bg-bg/40 transition-colors ${
                  dragOverKey === key ? 'border-brand bg-brand-light/60 ring-2 ring-brand/40' : 'border-line'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenDay(key)}
                  title="하루 상세(시간 배치) 열기"
                  className={`block w-full rounded-t-card border-b border-line px-2.5 py-2 text-left transition-colors hover:bg-brand-light ${
                    isToday ? 'bg-brand-light' : ''
                  }`}
                >
                  <p className={`text-xs ${i >= 5 ? 'text-rose-500' : 'text-muted'}`}>{WD[i]}</p>
                  <p className="text-sm font-semibold text-ink">
                    {key.slice(5).replace('-', '/')}
                    {items.length > 0 && <span className="ml-1 text-xs text-muted">· {items.length}</span>}
                  </p>
                </button>
                <div className="space-y-2 p-2">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-muted/60">—</p>
                  ) : (
                    items
                      .slice()
                      .sort(byScheduledTime)
                      .map((q) => <Card key={q.id} q={q} prices={prices} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 날짜 미정 */}
      {undated.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">날짜 미정 ({undated.length})</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {undated.map((q) => (
              <Card key={q.id} q={q} prices={prices} />
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
