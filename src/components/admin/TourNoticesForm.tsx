'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTourNotices } from '@/app/admin/tour-actions';
import { TOUR_NOTICE_IDS, type TourNoticeId, type TourNotices } from '@/lib/tour-notices';
import { useSaveStatus, SaveStatusBadge } from './save-status';

const inputCls =
  'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 공통 안내 편집 — 환불·안전 규정을 한 곳에서. 표기법은 투어 상세 본문과 같다. */
export default function TourNoticesForm({
  initial,
  usage,
  lang,
  disabled = false
}: {
  initial: TourNotices;
  /** 안내별로 켜 둔 투어 이름 */
  usage: Record<TourNoticeId, string[]>;
  lang: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<TourNotices>(initial);
  const [saving, setSaving] = useState(false);
  const { status, show, showSaved } = useSaveStatus();
  const patch = (id: TourNoticeId, p: Partial<TourNotices[TourNoticeId]>) =>
    setValue((v) => ({ ...v, [id]: { ...v[id], ...p } }));

  async function save() {
    setSaving(true);
    const res = await saveTourNotices(value, lang);
    setSaving(false);
    if (res.error) show(res.error, 'err');
    else {
      showSaved('저장되었습니다.', res.sync);
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {TOUR_NOTICE_IDS.map((id) => (
        <section key={id} className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium text-ink" htmlFor={`notice-${id}-title`}>
              제목
            </label>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${usage[id].length ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {usage[id].length ? `${usage[id].length}개 투어에서 사용 중` : '아직 켠 투어 없음'}
            </span>
          </div>
          <input
            id={`notice-${id}-title`}
            value={value[id].title}
            onChange={(e) => patch(id, { title: e.target.value })}
            disabled={disabled}
            className={inputCls}
          />
          <label className="mt-4 block text-sm font-medium text-ink" htmlFor={`notice-${id}-body`}>
            내용 <span className="font-normal text-muted">(투어 본문과 같은 표기법: *목록, 1. 번호, 이름 : 값)</span>
          </label>
          <textarea
            id={`notice-${id}-body`}
            value={value[id].body}
            onChange={(e) => patch(id, { body: e.target.value })}
            rows={12}
            disabled={disabled}
            className={`${inputCls} resize-y !rounded-card`}
          />
          {usage[id].length > 0 && (
            <p className="mt-2 text-xs text-muted">사용 중: {usage[id].join(', ')}</p>
          )}
        </section>
      ))}

      <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-line bg-bg/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-6 py-2.5 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '공통 안내 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
