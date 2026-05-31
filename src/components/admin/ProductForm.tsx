'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';

type ProductDefaults = {
  title?: string;
  summary?: string;
  priceKRW?: number | string;
  heroImage?: string;
};

const labelCls = 'block text-sm font-medium text-ink';
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 투어 상품 1개 오버라이드 편집. slug 기준 product:{slug} 저장. */
export default function ProductForm({
  slug,
  baseTitle,
  defaults,
  disabled = false
}: {
  slug: string;
  baseTitle: string;
  defaults: ProductDefaults;
  disabled?: boolean;
}) {
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function action(formData: FormData) {
    setSaving(true);
    setMsg('');
    const priceRaw = String(formData.get('priceKRW') ?? '').replace(/[^0-9]/g, '');
    const res = await saveContent(`product:${slug}`, {
      title: String(formData.get('title') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      // 빈값이면 가격 미저장(메인은 "문의 시 안내"). 숫자만 저장.
      ...(priceRaw ? { priceKRW: Number(priceRaw) } : {}),
      heroImage: String(formData.get('heroImage') ?? '')
    });
    setSaving(false);
    setMsg(res.ok ? '저장되었습니다.' : (res.error ?? '저장 실패'));
  }

  return (
    <form action={action} className="space-y-3 rounded-card border border-line bg-bg/40 p-4">
      <h3 className="font-semibold text-ink">
        {baseTitle} <span className="text-xs font-normal text-muted">({slug})</span>
      </h3>

      <div>
        <label className={labelCls}>대표 이미지</label>
        <div className="mt-1">
          <MediaInput
            name="heroImage"
            prefix={`products/${slug}`}
            defaultUrl={defaults.heroImage}
            accept="image/*"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor={`${slug}-title`}>제목</label>
        <input
          id={`${slug}-title`}
          name="title"
          defaultValue={defaults.title}
          placeholder="비우면 기본값"
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor={`${slug}-summary`}>설명</label>
        <textarea
          id={`${slug}-summary`}
          name="summary"
          defaultValue={defaults.summary}
          placeholder="비우면 기본값"
          rows={2}
          disabled={disabled}
          className={`${inputCls} !rounded-card`}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor={`${slug}-price`}>
          {'가격 (원, 숫자만 · 비우면 "문의 시 안내")'}
        </label>
        <input
          id={`${slug}-price`}
          name="priceKRW"
          defaultValue={defaults.priceKRW != null ? String(defaults.priceKRW) : ''}
          inputMode="numeric"
          placeholder="예: 120000"
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
