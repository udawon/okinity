'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import { HOME_CONTENT_KEYS, type AssuranceItem } from '@/lib/home-content';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const inputCls =
  'w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted disabled:opacity-50';
const textareaCls =
  'w-full resize-y rounded-card border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted disabled:opacity-50';

/** 신뢰(왜 우리인가) 편집 — 섹션 제목 + 4개 카드(제목·설명). home_assurances 키에 저장. */
export default function AssurancesForm({
  defaults,
  defaultTitle,
  disabled = false
}: {
  defaults: AssuranceItem[];
  defaultTitle?: string;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [items, setItems] = useState<AssuranceItem[]>(defaults);
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<AssuranceItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...p } : it)));

  async function save() {
    setSaving(true);
    const res = await saveContent(HOME_CONTENT_KEYS.assurances, {
      sectionTitle: title.trim(),
      items: items.map((it) => ({ title: it.title.trim(), desc: it.desc.trim() }))
    });
    setSaving(false);
    if (res.ok) show('저장되었습니다.');
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
          placeholder="비우면 기본: 안심하고 맡기세요"
          disabled={disabled}
          rows={2}
          className={`mt-1 ${textareaCls}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-card border border-line bg-bg/40 p-3">
            <span className="text-sm font-medium text-ink">카드 #{i + 1}</span>
            <input
              value={it.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              placeholder="카드 제목"
              disabled={disabled}
              className={inputCls}
            />
            <textarea
              value={it.desc}
              onChange={(e) => patch(i, { desc: e.target.value })}
              placeholder="카드 설명"
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
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '신뢰 영역 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
      <p className="text-xs text-muted">
        아이콘 4종은 고정입니다. 빈 칸은 기본 문구가 사용됩니다. (en/日은 번역본 표시)
      </p>
    </div>
  );
}
