'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';

type Item = { image: string; caption?: string };

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 갤러리 이미지 배열 편집 — 추가/삭제/캡션. gallery 키에 { items } 저장. */
export default function GalleryForm({
  defaults,
  disabled = false
}: {
  defaults: Item[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState<Item[]>(defaults.length ? defaults : []);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const add = () => setItems((arr) => [...arr, { image: '', caption: '' }]);

  async function save() {
    setSaving(true);
    setMsg('');
    const clean = items.filter((it) => it.image.trim());
    const res = await saveContent('gallery', { items: clean });
    setSaving(false);
    setMsg(res.ok ? `저장되었습니다 (${clean.length}장).` : (res.error ?? '저장 실패'));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-card border border-line bg-bg/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">#{i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="text-sm text-red-600 hover:underline"
              >
                삭제
              </button>
            </div>
            <MediaInput
              prefix="gallery"
              defaultUrl={it.image}
              accept="image/*"
              disabled={disabled}
              onChange={(url) => patch(i, { image: url })}
            />
            <input
              value={it.caption ?? ''}
              onChange={(e) => patch(i, { caption: e.target.value })}
              placeholder="캡션 (선택)"
              disabled={disabled}
              className={inputCls}
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
          + 이미지 추가
        </button>
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '갤러리 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
