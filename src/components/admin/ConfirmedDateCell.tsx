'use client';

import { useState, useTransition } from 'react';
import { saveInquirySettlement } from '@/app/admin/actions';
import type { InquirySettlement } from '@/lib/inquiry-settlement';

/**
 * 전체 목록(표)에서 확정일을 인라인 편집 — 선택 즉시 저장(기존 정산금액은 보존).
 * 월별 보기와 동일한 저장소(site_content)를 쓰므로 두 화면이 자동 동기화된다.
 */
export default function ConfirmedDateCell({
  id,
  settlement
}: {
  id: string;
  settlement: InquirySettlement;
}) {
  const [date, setDate] = useState(settlement.confirmedDate ?? '');
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function onChange(v: string) {
    setDate(v);
    setOk(false);
    start(async () => {
      try {
        await saveInquirySettlement(id, {
          confirmedDate: v,
          amountJPY: settlement.amountJPY,
          amountKRW: settlement.amountKRW
        });
        setOk(true);
      } catch {
        /* 무시 — 사용자가 재시도 */
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="date"
        aria-label="확정일"
        value={date.slice(0, 10)}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="rounded-button border border-line bg-bg px-2 py-1 text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-50"
      />
      {ok && <span className="text-xs text-emerald-600">✓</span>}
    </span>
  );
}
