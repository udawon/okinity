'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import { HOME_CONTENT_KEYS, type TestimonialItem } from '@/lib/home-content';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:opacity-50';
const textareaCls =
  'w-full resize-y rounded-card border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted disabled:opacity-50';

/** 후기 편집 — 섹션 제목 + 후기 목록(이름·도시·투어·인용문) CRUD. home_testimonials 키에 저장. */
export default function TestimonialsForm({
  defaults,
  defaultTitle,
  disabled = false
}: {
  defaults: TestimonialItem[];
  defaultTitle?: string;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [items, setItems] = useState<TestimonialItem[]>(defaults);
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<TestimonialItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () =>
    setItems((arr) => [...arr, { name: '', city: '', tour: '', quote: '' }]);

  async function save() {
    setSaving(true);
    const clean = items.filter((it) => it.quote.trim() || it.name.trim());
    const res = await saveContent(HOME_CONTENT_KEYS.testimonials, {
      sectionTitle: title.trim(),
      items: clean
    });
    setSaving(false);
    if (res.ok) show(`저장되었습니다 (후기 ${clean.length}개).`);
    else show(res.error ?? '저장 실패', 'err');
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">
          섹션 제목 (선택) <span className="font-normal text-muted">· Enter로 줄바꿈</span>
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="비우면 기본: 다녀온 분들의 이야기"
          disabled={disabled}
          rows={2}
          className={`mt-1 ${textareaCls}`}
        />
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-card border border-line bg-bg/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">후기 #{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                삭제
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={it.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="이름 (예: 김지은)"
                disabled={disabled}
                className={inputCls}
              />
              <input
                value={it.city}
                onChange={(e) => patch(i, { city: e.target.value })}
                placeholder="지역 (예: 서울)"
                disabled={disabled}
                className={inputCls}
              />
              <input
                value={it.tour}
                onChange={(e) => patch(i, { tour: e.target.value })}
                placeholder="투어 (예: 푸른동굴 체험다이빙)"
                disabled={disabled}
                className={inputCls}
              />
            </div>
            <textarea
              value={it.quote}
              onChange={(e) => patch(i, { quote: e.target.value })}
              placeholder="후기 내용"
              rows={3}
              disabled={disabled}
              className={textareaCls}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="rounded-button border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-brand disabled:opacity-50"
        >
          + 후기 추가
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '후기 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
      <p className="text-xs text-muted">
        후기를 모두 비우고 저장하면 기본 샘플 후기가 표시됩니다. (en/日 페이지는 번역본이 표시됩니다)
      </p>
    </div>
  );
}
