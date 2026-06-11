'use client';

import { useMemo, useState } from 'react';
import SettlementRow from './SettlementRow';
import {
  effectiveDate,
  monthKey,
  emptySettlement,
  type SettlementMap
} from '@/lib/inquiry-settlement';
import type { Inquiry } from '@/lib/inquiries/types';

const won = (n: number) => '₩' + n.toLocaleString('ko-KR');
const yen = (n: number) => '¥' + n.toLocaleString('ko-KR');

/**
 * 예약 월별 보기 — 확정일(없으면 희망일) 기준으로 월 단위 탐색. 그 달 예약 목록 + 정산 수익 합계(¥/₩).
 * 각 행에서 확정일·정산금액을 바로 입력(환율 자동 변환). 날짜 없는 예약은 하단 '날짜 미정'에 모아 노출.
 */
export default function ReservationMonthly({
  inquiries,
  settlements,
  rate,
  todayKey
}: {
  inquiries: Inquiry[];
  settlements: SettlementMap;
  rate: number;
  todayKey: string;
}) {
  const [ty, tm] = todayKey.split('-').map(Number);
  const [ym, setYm] = useState({ y: ty, m: tm }); // m: 1-based

  // 예약 → { inquiry, settlement, mk(월키) }
  const rows = useMemo(
    () =>
      inquiries.map((q) => {
        const s = settlements[q.id] ?? emptySettlement();
        const eff = effectiveDate(s.confirmedDate, q.date);
        return { q, s, eff, mk: monthKey(eff) };
      }),
    [inquiries, settlements]
  );

  const curKey = `${ym.y}-${String(ym.m).padStart(2, '0')}`;
  const monthRows = useMemo(
    () =>
      rows
        .filter((r) => r.mk === curKey)
        .sort((a, b) => a.eff.localeCompare(b.eff) || a.q.name.localeCompare(b.q.name)),
    [rows, curKey]
  );
  const undated = useMemo(() => rows.filter((r) => r.mk === ''), [rows]);

  // 수익 합계 — 취소 제외, 그 달 정산금액 합.
  const totals = useMemo(() => {
    let jpy = 0;
    let krw = 0;
    let counted = 0;
    for (const r of monthRows) {
      if (r.q.status === 'canceled') continue;
      if (r.s.amountJPY) jpy += r.s.amountJPY;
      if (r.s.amountKRW) krw += r.s.amountKRW;
      if (r.s.amountJPY || r.s.amountKRW) counted += 1;
    }
    return { jpy, krw, counted };
  }, [monthRows]);

  const shift = (delta: number) =>
    setYm(({ y, m }) => {
      const idx = (y * 12 + (m - 1)) + delta;
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    });

  return (
    <div className="space-y-4">
      {/* 월 네비게이터 + 수익 요약 */}
      <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="이전 달"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:border-brand hover:text-ink"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">
              {ym.y}년 {ym.m}월
            </p>
            <p
              className="mt-0.5 text-[11px] font-medium text-muted"
              title="확정일이 있으면 확정일, 미확정 예약은 희망일 기준으로 집계됩니다"
            >
              확정일 기준 예약건
            </p>
            <button
              type="button"
              onClick={() => setYm({ y: ty, m: tm })}
              className="mt-1 text-xs text-muted hover:text-brand"
            >
              이번 달로
            </button>
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="다음 달"
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:border-brand hover:text-ink"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-card bg-bg/60 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted">예약</div>
            <div className="mt-0.5 text-lg font-bold text-ink">{monthRows.length}건</div>
          </div>
          <div className="rounded-card bg-bg/60 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted">수익 (엔)</div>
            <div className="mt-0.5 text-lg font-bold text-ink">{yen(totals.jpy)}</div>
          </div>
          <div className="rounded-card bg-bg/60 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-muted">수익 (원)</div>
            <div className="mt-0.5 text-lg font-bold text-ink">{won(totals.krw)}</div>
          </div>
        </div>
        {totals.counted > 0 && (
          <p className="mt-2 text-center text-xs text-muted">
            정산 입력 {totals.counted}건 기준 · 취소 제외
          </p>
        )}
      </div>

      {/* 그 달 예약 목록 */}
      <div className="rounded-card border border-line bg-surface">
        {monthRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">이 달에 예약(확정/희망일)이 없습니다.</p>
        ) : (
          monthRows.map((r) => (
            <SettlementRow key={r.q.id} inquiry={r.q} settlement={r.s} rate={rate} />
          ))
        )}
      </div>

      {/* 날짜 미정 — 확정일을 지정하면 해당 월로 들어간다 */}
      {undated.length > 0 && (
        <div className="rounded-card border border-dashed border-line bg-surface">
          <p className="border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">
            날짜 미정 <span className="text-muted">({undated.length}건)</span>
            <span className="ml-2 font-normal text-xs text-muted">
              확정일을 지정하면 해당 월에 표시됩니다
            </span>
          </p>
          {undated.map((r) => (
            <SettlementRow key={r.q.id} inquiry={r.q} settlement={r.s} rate={rate} />
          ))}
        </div>
      )}
    </div>
  );
}
