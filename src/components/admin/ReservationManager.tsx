'use client';

import { useState } from 'react';
import InquiryTable from './InquiryTable';
import ReservationMonthly from './ReservationMonthly';
import type { SettlementMap } from '@/lib/inquiry-settlement';
import type { Inquiry } from '@/lib/inquiries/types';

type Rate = { jpyKrw: number; asOf: string; live: boolean };

/** 환율 갱신 일시 문자열 → M/D 표시(파싱 실패 시 빈 문자열). */
function rateDate(asOf: string): string {
  if (!asOf) return '';
  const d = new Date(asOf);
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 예약 관리 — '월별 보기'(확정일 기준 월 네비 + 정산 수익)와 '전체 목록'(검색·필터) 전환.
 * 월별 보기에서 확정일·정산금액(¥/₩, 환율 자동 변환)을 입력한다.
 */
export default function ReservationManager({
  inquiries,
  settlements,
  rate,
  todayKey
}: {
  inquiries: Inquiry[];
  settlements: SettlementMap;
  rate: Rate;
  todayKey: string;
}) {
  const [view, setView] = useState<'monthly' | 'list'>('monthly');
  const d = rateDate(rate.asOf);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 보기 전환 */}
        <div className="inline-flex rounded-button border border-line bg-surface p-0.5">
          {(['monthly', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-[6px] px-4 py-1.5 text-sm font-medium transition-colors ${
                view === v ? 'bg-brand text-brand-contrast' : 'text-muted hover:text-ink'
              }`}
            >
              {v === 'monthly' ? '월별 보기' : '전체 목록'}
            </button>
          ))}
        </div>

        {/* 적용 환율 (월별 보기의 자동 변환 기준) */}
        {view === 'monthly' && (
          <p className="text-xs text-muted">
            💱 적용 환율 <strong className="text-ink">1엔 = {rate.jpyKrw.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원</strong>
            {d && <span> · {d} 기준</span>}
            {!rate.live && <span className="text-amber-600"> · 임시(네트워크 오류)</span>}
          </p>
        )}
      </div>

      {view === 'monthly' ? (
        <ReservationMonthly
          inquiries={inquiries}
          settlements={settlements}
          rate={rate.jpyKrw}
          todayKey={todayKey}
        />
      ) : (
        <InquiryTable inquiries={inquiries} settlements={settlements} />
      )}
    </div>
  );
}
