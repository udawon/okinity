'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { updateInquiry } from '@/app/admin/actions';
import { ACTIVITIES } from '@/components/ocean-home-data';
import type { Inquiry } from '@/lib/inquiries/types';

const TIME_OPTS = ['오전', '오후', '종일', '시간 무관'];

/** 기존 product 문자열("대분류 · 세부") → 대분류 id + 세부 slug 역매핑. */
function parseProduct(product?: string): { catId: string; slug: string } {
  if (!product) return { catId: '', slug: '' };
  const a = ACTIVITIES.find((x) => product.startsWith(x.title));
  const namePart = product.includes(' · ') ? product.split(' · ').slice(1).join(' · ') : '';
  const tour = a?.tours.find((t) => t.name === namePart);
  return { catId: a?.id ?? '', slug: tour?.slug ?? '' };
}

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

  const init = parseProduct(inquiry.product);
  const [catId, setCatId] = useState(init.catId);
  const [slug, setSlug] = useState(init.slug);
  const cat = ACTIVITIES.find((a) => a.id === catId);

  // 기존 시간값이 표준 옵션에 없으면(직접 입력 등) 보존용으로 추가
  const timeOptions =
    inquiry.time && !TIME_OPTS.includes(inquiry.time) ? [inquiry.time, ...TIME_OPTS] : TIME_OPTS;

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tourName = cat?.tours.find((t) => t.slug === slug)?.name ?? '';
    const product = cat ? `${cat.title}${tourName ? ' · ' + tourName : ''}` : '';
    start(async () => {
      try {
        await updateInquiry(inquiry.id, {
          product,
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
                <label htmlFor="ei-cat" className={labelCls}>
                  투어 종류
                </label>
                <select
                  id="ei-cat"
                  value={catId}
                  onChange={(e) => {
                    setCatId(e.target.value);
                    setSlug('');
                  }}
                  className={inputCls}
                >
                  <option value="">선택 안 함</option>
                  {ACTIVITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ei-tour" className={labelCls}>
                  세부 프로그램
                </label>
                <select
                  id="ei-tour"
                  value={slug}
                  disabled={!cat}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">{cat ? '선택 안 함' : '먼저 투어 종류 선택'}</option>
                  {cat?.tours.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
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
                    희망 시간대
                  </label>
                  <select
                    id="ei-time"
                    name="time"
                    defaultValue={inquiry.time ?? ''}
                    className={inputCls}
                  >
                    <option value="">선택 안 함</option>
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
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
