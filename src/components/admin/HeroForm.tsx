'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';

type HeroDefaults = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaType?: string;
};

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

export default function HeroForm({
  defaults,
  disabled = false
}: {
  defaults: HeroDefaults;
  disabled?: boolean;
}) {
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function action(formData: FormData) {
    setSaving(true);
    setMsg('');
    const res = await saveContent('hero', {
      eyebrow: String(formData.get('eyebrow') ?? ''),
      title: String(formData.get('title') ?? ''),
      subtitle: String(formData.get('subtitle') ?? ''),
      mediaUrl: String(formData.get('mediaUrl') ?? ''),
      mediaType: String(formData.get('mediaType') ?? 'image')
    });
    setSaving(false);
    setMsg(res.ok ? '저장되었습니다.' : (res.error ?? '저장 실패'));
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelCls}>배경 이미지 / 동영상</label>
        <p className="mb-2 mt-0.5 text-xs text-muted">
          비워두면 기본 이미지가 사용됩니다. 동영상은 자동재생(무음 루프)됩니다.
        </p>
        <MediaInput name="mediaUrl" prefix="hero" defaultUrl={defaults.mediaUrl} disabled={disabled} />
      </div>

      <div>
        <label className={labelCls} htmlFor="hero-mediaType">
          배경 종류
        </label>
        <select
          id="hero-mediaType"
          name="mediaType"
          defaultValue={defaults.mediaType ?? 'image'}
          disabled={disabled}
          className={inputCls}
        >
          <option value="image">이미지</option>
          <option value="video">동영상</option>
        </select>
      </div>

      <div>
        <label className={labelCls} htmlFor="hero-eyebrow">
          작은 라벨 (eyebrow)
        </label>
        <input
          id="hero-eyebrow"
          name="eyebrow"
          defaultValue={defaults.eyebrow}
          placeholder="비우면 기본 문구"
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="hero-title">
          제목
        </label>
        <p className="mb-1 mt-0.5 text-xs text-muted">
          줄바꿈(Enter)으로 여러 줄. 줄이 2개 이상이면 마지막 줄이 강조색(오션)으로 표시됩니다.
        </p>
        <textarea
          id="hero-title"
          name="title"
          defaultValue={defaults.title}
          placeholder="비우면 기본 문구"
          disabled={disabled}
          rows={2}
          className={`${inputCls} !rounded-card`}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="hero-subtitle">
          부제
        </label>
        <p className="mb-1 mt-0.5 text-xs text-muted">줄바꿈(Enter) 가능.</p>
        <textarea
          id="hero-subtitle"
          name="subtitle"
          defaultValue={defaults.subtitle}
          placeholder="비우면 기본 문구"
          disabled={disabled}
          rows={2}
          className={`${inputCls} !rounded-card`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : 'Hero 저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}
