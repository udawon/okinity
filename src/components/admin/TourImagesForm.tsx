'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import MediaInput from './MediaInput';
import { ACTIVITIES } from '../ocean-home-data';
import { useSaveStatus, SaveStatusBadge } from './save-status';

/**
 * 홈 투어 카테고리 카드 이미지 편집 — 다이빙·PADI·낚시·스노클링 각 1장.
 * home_tours 키에 { images: { [activityId]: url } } 저장. 비운 항목은 기본 이미지 사용.
 */
export default function TourImagesForm({
  defaults,
  disabled = false
}: {
  defaults: Record<string, string>;
  disabled?: boolean;
}) {
  const [images, setImages] = useState<Record<string, string>>(defaults ?? {});
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  const set = (id: string, url: string) => setImages((m) => ({ ...m, [id]: url }));

  async function save() {
    setSaving(true);
    const res = await saveContent('home_tours', { images });
    setSaving(false);
    if (res.ok) show('저장되었습니다.');
    else show(res.error ?? '저장 실패', 'err');
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {ACTIVITIES.map((a) => (
          <div key={a.id}>
            <label className="block text-sm font-medium text-ink">{a.title}</label>
            <p className="mb-2 mt-0.5 text-xs text-muted">{a.kicker}</p>
            <MediaInput
              prefix="home-tours"
              accept="image/*"
              defaultUrl={images[a.id] ?? ''}
              disabled={disabled}
              onChange={(url) => set(a.id, url)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '투어 이미지 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
