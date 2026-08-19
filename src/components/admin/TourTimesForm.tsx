'use client';

import { useState } from 'react';
import { saveContent } from '@/app/admin/content-actions';
import { ACTIVITIES } from '@/components/ocean-home-data';
import type { TourTimes } from '@/lib/tour-times';

import { useSaveStatus, SaveStatusBadge } from './save-status';

const inputCls =
  'rounded-button border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted';

/** 문의 API time 필드의 최대 길이(NewInquirySchema, src/lib/inquiries/types.ts). 초과 항목을 저장하면
 *  해당 옵션을 선택한 예약 문의가 항상 검증(400)에 걸려 접수가 불가능하므로 저장 전에 막는다. */
const MAX_TIME_LEN = 40;

/** 투어별 시간대 편집 — 투어(slug)마다 쉼표 구분 텍스트 입력. tour_times 키에 { times } 저장. */
export default function TourTimesForm({
  defaults,
  disabled = false
}: {
  defaults: TourTimes;
  disabled?: boolean;
}) {
  // slug → 쉼표 구분 텍스트(입력 그대로 편집, 저장 시 분리·정리)
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of ACTIVITIES)
      for (const tr of a.tours) init[tr.slug] = (defaults[tr.slug] ?? []).join(', ');
    return init;
  });
  const { status, show } = useSaveStatus();
  const [saving, setSaving] = useState(false);

  async function save() {
    // 쉼표 분리 → trim → 빈 값·중복 제거. 비어 있는 투어는 저장하지 않는다(예약 폼에선 '개별 문의').
    const times: Record<string, string[]> = {};
    for (const [slug, text] of Object.entries(texts)) {
      const list = Array.from(
        new Set(
          text
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      const tooLong = list.find((s) => s.length > MAX_TIME_LEN);
      if (tooLong) {
        show(`시간대는 항목당 ${MAX_TIME_LEN}자 이내로 입력해 주세요: "${tooLong}"`, 'err');
        return;
      }
      if (list.length) times[slug] = list;
    }
    setSaving(true);
    const res = await saveContent('tour_times', { times });
    setSaving(false);
    if (res.ok) show(`저장되었습니다 (${Object.keys(times).length}개 투어).`);
    else show(res.error ?? '저장 실패', 'err');
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        시간대를 비워두면 예약 폼에 &lsquo;개별 문의&rsquo;로 표시됩니다. 입력한 텍스트가 그대로
        선택지가 됩니다(항목당 {MAX_TIME_LEN}자 이내).
      </p>

      {ACTIVITIES.map((a) => (
        <fieldset key={a.id} className="rounded-card border border-line bg-bg/40 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">{a.title}</legend>
          <div className="space-y-2">
            {a.tours.map((tr) => (
              <div key={tr.slug} className="flex flex-wrap items-center gap-2">
                <label htmlFor={`tt-${tr.slug}`} className="w-52 shrink-0 text-sm text-ink">
                  {tr.name}
                </label>
                <input
                  id={`tt-${tr.slug}`}
                  value={texts[tr.slug] ?? ''}
                  onChange={(e) =>
                    setTexts((m) => ({ ...m, [tr.slug]: e.target.value }))
                  }
                  placeholder='예: "08:00, 13:00" 또는 "오전 8시 출발"'
                  disabled={disabled}
                  className={`${inputCls} min-w-[16rem] flex-1`}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="rounded-button bg-brand px-5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? '저장 중…' : '시간대 저장'}
        </button>
        <SaveStatusBadge status={status} />
      </div>
    </div>
  );
}
