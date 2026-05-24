'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';

type SignatureDefaults = {
  title?: string;
  description?: string;
  image?: string;
  video?: string;
};

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 시그니처 경험 카드 1개 오버라이드. href 기준 signature:{href} 저장. */
export default function SignatureForm({
  href,
  label,
  defaults,
  disabled = false
}: {
  href: string;
  label: string;
  defaults: SignatureDefaults;
  disabled?: boolean;
}) {
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const id = href.replace(/\W/g, '');

  async function action(formData: FormData) {
    setSaving(true);
    setMsg('');
    const res = await saveContent(`signature:${href}`, {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      image: String(formData.get('image') ?? ''),
      video: String(formData.get('video') ?? '')
    });
    setSaving(false);
    setMsg(res.ok ? '저장되었습니다.' : (res.error ?? '저장 실패'));
  }

  return (
    <form action={action} className="space-y-3 rounded-card border border-line bg-bg/40 p-4">
      <h3 className="font-semibold text-ink">
        {label} <span className="text-xs font-normal text-muted">({href})</span>
      </h3>

      <div>
        <label className={labelCls}>이미지 (포스터/배경)</label>
        <div className="mt-1">
          <MediaInput name="image" prefix={`signature${id}`} defaultUrl={defaults.image} accept="image/*" disabled={disabled} />
        </div>
      </div>

      <div>
        <label className={labelCls}>동영상 (선택 — 있으면 자동재생)</label>
        <div className="mt-1">
          <MediaInput name="video" prefix={`signature${id}`} defaultUrl={defaults.video} accept="video/*" disabled={disabled} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor={`${id}-title`}>제목</label>
        <input
          id={`${id}-title`}
          name="title"
          defaultValue={defaults.title}
          placeholder="비우면 기본값"
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor={`${id}-desc`}>설명</label>
        <textarea
          id={`${id}-desc`}
          name="description"
          defaultValue={defaults.description}
          placeholder="비우면 기본값"
          rows={2}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || saving}
          className="rounded-button bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}
