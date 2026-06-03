'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveTourPrices } from '@/app/admin/pricing-actions';
import { TOUR_CATALOG } from '@/lib/tour';
import type { TourPrices } from '@/lib/tour-pricing';

/**
 * 투어별 기준 단가 입력 — 운영 보드 예상매출(단가×인원)용. 어드민 전용, 고객 비노출.
 */
export default function TourPricingForm({
  defaults,
  disabled
}: {
  defaults: TourPrices;
  disabled?: boolean;
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const t of TOUR_CATALOG) o[t.slug] = defaults[t.slug] != null ? String(defaults[t.slug]) : '';
    return o;
  });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  // 카테고리별 그룹
  const groups = useMemo(() => {
    const m = new Map<string, typeof TOUR_CATALOG>();
    for (const t of TOUR_CATALOG) {
      const arr = m.get(t.categoryTitle) ?? [];
      arr.push(t);
      m.set(t.categoryTitle, arr);
    }
    return [...m.entries()];
  }, []);

  function save() {
    start(async () => {
      const out: Record<string, number> = {};
      for (const [slug, v] of Object.entries(prices)) {
        const n = Number(v);
        if (v.trim() && Number.isFinite(n) && n >= 0) out[slug] = Math.round(n);
      }
      try {
        await saveTourPrices(out);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        alert('단가 저장에 실패했습니다.');
      }
    });
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">투어별 기준 단가</h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        운영 보드의 <strong>예상매출(단가 × 인원)</strong> 계산에 쓰입니다. 1인 기준 금액(원). 비우면
        예상매출 미표시. <strong>고객에게는 보이지 않습니다.</strong>
      </p>

      <div className="space-y-5">
        {groups.map(([title, tours]) => (
          <div key={title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
            <div className="mt-2 space-y-2">
              {tours.map((t) => (
                <div key={t.slug} className="flex items-center gap-3">
                  <label htmlFor={`price-${t.slug}`} className="flex-1 text-sm text-ink">
                    {t.name}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`price-${t.slug}`}
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      value={prices[t.slug] ?? ''}
                      disabled={disabled}
                      onChange={(e) => setPrices((p) => ({ ...p, [t.slug]: e.target.value }))}
                      placeholder="0"
                      className="w-32 rounded-button border border-line bg-bg px-3 py-2 text-right text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-50"
                    />
                    <span className="text-sm text-muted">원</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || pending}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? '저장 중…' : '단가 저장'}
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}
