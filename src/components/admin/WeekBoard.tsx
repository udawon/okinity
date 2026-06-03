'use client';

import { useMemo, useState } from 'react';
import StatusControl from './StatusControl';
import EditInquiryButton from './EditInquiryButton';
import { ACTIVITIES } from '@/components/ocean-home-data';
import { TOUR_CATALOG } from '@/lib/tour';
import { estimateRevenue, type TourPrices } from '@/lib/tour-pricing';
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

/** product 표시문자열 → 대분류 색 + 단가 계산용 slug. */
function tourMeta(product?: string): { accent: string; slug: string | null } {
  if (!product) return { accent: '#64748b', slug: null };
  const a = ACTIVITIES.find((x) => product.startsWith(x.title));
  const namePart = product.includes(' · ') ? product.split(' · ').slice(1).join(' · ') : '';
  const entry = TOUR_CATALOG.find((t) => t.name === namePart);
  return { accent: a?.accent ?? '#64748b', slug: entry?.slug ?? null };
}

function Card({ q, prices }: { q: Inquiry; prices: TourPrices }) {
  const { accent, slug } = tourMeta(q.product);
  const rev = slug ? estimateRevenue(prices, slug, q.people) : null;
  return (
    <div
      className="rounded-lg border border-line bg-surface p-2.5 shadow-sm"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-xs font-semibold leading-tight text-ink">{q.product || '투어 미정'}</p>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        {q.people ? `${q.people}명` : '인원 미정'}
        {q.time ? ` · ${q.time}` : ''}
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
              <div key={key} className="rounded-card border border-line bg-bg/40">
                <div
                  className={`rounded-t-card border-b border-line px-2.5 py-2 ${
                    isToday ? 'bg-brand-light' : ''
                  }`}
                >
                  <p className={`text-xs ${i >= 5 ? 'text-rose-500' : 'text-muted'}`}>{WD[i]}</p>
                  <p className="text-sm font-semibold text-ink">{key.slice(5).replace('-', '/')}</p>
                </div>
                <div className="space-y-2 p-2">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-muted/60">—</p>
                  ) : (
                    items.map((q) => <Card key={q.id} q={q} prices={prices} />)
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
    </div>
  );
}
