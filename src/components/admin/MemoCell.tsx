'use client';

import { useState, useTransition } from 'react';
import { updateInquiryNote } from '@/app/admin/actions';

/**
 * 예약 문의 내부 메모 — 운영자용(고객 비노출). 클릭하면 편집, 저장 시 서버액션 호출.
 */
export default function MemoCell({ id, note }: { id: string; note?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note ?? '');
  const [saved, setSaved] = useState(note ?? '');
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateInquiryNote(id, value);
        setSaved(value);
        setEditing(false);
      } catch {
        alert('메모 저장에 실패했습니다.');
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block max-w-[14rem] truncate text-left text-sm text-muted hover:text-ink"
        title={saved || '메모 추가'}
      >
        {saved ? (
          <span className="text-ink">{saved}</span>
        ) : (
          <span className="text-muted/70">+ 메모</span>
        )}
      </button>
    );
  }

  return (
    <div className="w-56">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="통화 결과·특이사항…"
        className="w-full rounded-button border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
      />
      <div className="mt-1 flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-button bg-brand px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(saved);
            setEditing(false);
          }}
          disabled={pending}
          className="rounded-button border border-line px-2.5 py-1 text-xs text-muted hover:text-ink disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}
