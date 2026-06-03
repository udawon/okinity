'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { updateInquiry } from '@/app/admin/actions';
import type { Inquiry } from '@/lib/inquiries/types';

const inputCls =
  'mt-1 w-full rounded-button border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none';
const labelCls = 'block text-xs font-medium text-muted';

/**
 * 예약 내용 수정 — 운영자가 양해·합의 후 날짜·시간·투어·인원 등을 변경(확정 예약 포함).
 * 상태·메모·접수시각은 유지.
 */
export default function EditInquiryButton({ inquiry }: { inquiry: Inquiry }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        await updateInquiry(inquiry.id, {
          product: fd.get('product'),
          date: fd.get('date'),
          time: fd.get('time'),
          people: fd.get('people'),
          name: fd.get('name'),
          contact: fd.get('contact'),
          message: fd.get('message')
        });
        setOpen(false);
      } catch {
        alert('수정에 실패했습니다.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-button border border-line px-2 py-1 text-sm text-muted transition-colors hover:border-brand hover:text-ink"
      >
        수정
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={() => !pending && setOpen(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-hover"
          >
            <h2 className="text-lg font-bold text-ink">예약 수정</h2>
            <p className="mt-1 text-xs text-muted">
              합의된 변경 사항을 반영하세요. 확정 예약을 바꾸면 공개 일정표도 갱신됩니다.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="ei-product" className={labelCls}>
                  투어
                </label>
                <input
                  id="ei-product"
                  name="product"
                  type="text"
                  defaultValue={inquiry.product ?? ''}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ei-date" className={labelCls}>
                    날짜
                  </label>
                  <input
                    id="ei-date"
                    name="date"
                    type="date"
                    defaultValue={/^\d{4}-\d{2}-\d{2}/.test(inquiry.date ?? '') ? inquiry.date!.slice(0, 10) : ''}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="ei-time" className={labelCls}>
                    시간대
                  </label>
                  <input
                    id="ei-time"
                    name="time"
                    type="text"
                    defaultValue={inquiry.time ?? ''}
                    placeholder="예: 오전, 14:00"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ei-people" className={labelCls}>
                  인원
                </label>
                <input
                  id="ei-people"
                  name="people"
                  type="number"
                  min={1}
                  defaultValue={inquiry.people ?? ''}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ei-name" className={labelCls}>
                    이름 *
                  </label>
                  <input
                    id="ei-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={inquiry.name}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="ei-contact" className={labelCls}>
                    연락처 *
                  </label>
                  <input
                    id="ei-contact"
                    name="contact"
                    type="text"
                    required
                    defaultValue={inquiry.contact}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ei-message" className={labelCls}>
                  요청사항
                </label>
                <textarea
                  id="ei-message"
                  name="message"
                  rows={2}
                  defaultValue={inquiry.message ?? ''}
                  className={`${inputCls} !rounded-card`}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-button border border-line px-4 py-2 text-sm text-muted hover:text-ink disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-button bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {pending ? '저장 중…' : '저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
