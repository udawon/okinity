'use client';

import { useState, useTransition } from 'react';
import { updateInquiryStatus } from '@/app/admin/actions';
import { INQUIRY_STATUSES, type InquiryStatus } from '@/lib/inquiries/types';

const LABEL: Record<InquiryStatus, string> = {
  new: '신규',
  tentative: '가예약',
  confirmed: '확정',
  done: '완료',
  canceled: '취소'
};

const COLOR: Record<InquiryStatus, string> = {
  new: 'bg-brand-light text-brand-dark',
  tentative: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  canceled: 'bg-gray-100 text-gray-500'
};

export default function StatusControl({
  id,
  status
}: {
  id: string;
  status: InquiryStatus;
}) {
  const [current, setCurrent] = useState<InquiryStatus>(status);
  const [pending, startTransition] = useTransition();

  function onChange(next: InquiryStatus) {
    const prev = current;
    setCurrent(next); // 낙관적 업데이트
    startTransition(async () => {
      try {
        await updateInquiryStatus(id, next);
      } catch {
        setCurrent(prev); // 실패 시 롤백
      }
    });
  }

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as InquiryStatus)}
      className={`rounded-button px-2 py-1 text-sm font-medium disabled:opacity-50 ${COLOR[current]}`}
      aria-label="문의 상태 변경"
    >
      {INQUIRY_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LABEL[s]}
        </option>
      ))}
    </select>
  );
}
