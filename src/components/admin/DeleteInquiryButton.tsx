'use client';

import { useTransition } from 'react';
import { deleteInquiry } from '@/app/admin/actions';

/**
 * 예약 문의 삭제 버튼. 영구 삭제(되돌릴 수 없음)이므로 confirm 2차 확인 후 실행.
 */
export default function DeleteInquiryButton({
  id,
  name
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(`'${name}' 님의 예약 문의를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteInquiry(id);
      } catch {
        alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-button border border-line px-2 py-1 text-sm text-muted transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      aria-label={`${name} 문의 삭제`}
    >
      {pending ? '삭제 중…' : '삭제'}
    </button>
  );
}
