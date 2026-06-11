'use client';

import { useState } from 'react';
import { useSaveStatus, SaveStatusBadge } from './save-status';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';

type HeroDefaults = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaType?: string;
  badge1?: string;
  badge2?: string;
  badge3?: string;
  ctaReserve?: string;
  ctaExplore?: string;
  hideEyebrow?: boolean;
  hideSubtitle?: boolean;
  hideBadges?: boolean;
};

const labelCls = 'block text-sm font-medium text-ink';

/** 영역 표시/숨김 체크박스. 체크=표시(name=on). 끄면 해당 Hero 블록을 전 언어에서 숨김. */
function ShowToggle({
  name,
  defaultShown,
  disabled
}: {
  name: string;
  defaultShown: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultShown}
        disabled={disabled}
        className="h-4 w-4 accent-brand"
      />
      표시
    </label>
  );
}
const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

export default function HeroForm({
  defaults,
  disabled = false
}: {
  defaults: HeroDefaults;
  disabled?: boolean;
}) {
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  async function action(formData: FormData) {
    setSaving(true);
    const res = await saveContent('hero', {
      eyebrow: String(formData.get('eyebrow') ?? ''),
      title: String(formData.get('title') ?? ''),
      subtitle: String(formData.get('subtitle') ?? ''),
      mediaUrl: String(formData.get('mediaUrl') ?? ''),
      mediaType: String(formData.get('mediaType') ?? 'image'),
      badge1: String(formData.get('badge1') ?? ''),
      badge2: String(formData.get('badge2') ?? ''),
      badge3: String(formData.get('badge3') ?? ''),
      ctaReserve: String(formData.get('ctaReserve') ?? ''),
      ctaExplore: String(formData.get('ctaExplore') ?? ''),
      // 체크박스 미체크 = 숨김. (체크 시 값 'on')
      hideEyebrow: formData.get('showEyebrow') !== 'on',
      hideSubtitle: formData.get('showSubtitle') !== 'on',
      hideBadges: formData.get('showBadges') !== 'on'
    });
    setSaving(false);
    if (res.ok) show('저장되었습니다.');
    else show(res.error ?? '저장 실패', 'err');
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
          className={`${inputCls} app-select app-select-light`}
        >
          <option value="image">이미지</option>
          <option value="video">동영상</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="hero-eyebrow">
            작은 라벨 (eyebrow)
          </label>
          <ShowToggle name="showEyebrow" defaultShown={!defaults.hideEyebrow} disabled={disabled} />
        </div>
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
        <div className="flex items-center justify-between">
          <label className={labelCls} htmlFor="hero-subtitle">
            부제
          </label>
          <ShowToggle name="showSubtitle" defaultShown={!defaults.hideSubtitle} disabled={disabled} />
        </div>
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

      <div>
        <label className={labelCls}>CTA 버튼 문구</label>
        <p className="mb-1 mt-0.5 text-xs text-muted">비우면 기본(예약하기 / 둘러보기). 링크는 고정.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="ctaReserve"
            defaultValue={defaults.ctaReserve}
            placeholder="기본: 투어 예약하기"
            disabled={disabled}
            className={inputCls}
          />
          <input
            name="ctaExplore"
            defaultValue={defaults.ctaExplore}
            placeholder="기본: 액티비티 둘러보기"
            disabled={disabled}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelCls}>신뢰 배지 (최대 3개)</label>
          <ShowToggle name="showBadges" defaultShown={!defaults.hideBadges} disabled={disabled} />
        </div>
        <p className="mb-1 mt-0.5 text-xs text-muted">하단 작은 배지 문구. 비우면 기본값.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            name="badge1"
            defaultValue={defaults.badge1}
            placeholder="기본: PADI 공인 다이브센터"
            disabled={disabled}
            className={inputCls}
          />
          <input
            name="badge2"
            defaultValue={defaults.badge2}
            placeholder="기본: 10년 무사고"
            disabled={disabled}
            className={inputCls}
          />
          <input
            name="badge3"
            defaultValue={defaults.badge3}
            placeholder="기본: 한국어 가이드 동행"
            disabled={disabled}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : 'Hero 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </form>
  );
}
