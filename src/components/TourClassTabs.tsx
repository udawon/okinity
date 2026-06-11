'use client';

import { useState } from 'react';
import { cdnMedia } from '@/lib/media';
import { FISHING_CLASS_KEYS, type FishingClassKey, type TourClasses } from '@/lib/tour';

/**
 * 낚시 투어 상세의 '클래스' 섹션 — 미들/럭셔리 탭으로 사진+설명을 전환 노출.
 * 소분류(클래스)는 별도 페이지를 두지 않고 이 탭으로만 보여준다(요구사항 2).
 */
export default function TourClassTabs({
  classes,
  accent,
  labels
}: {
  classes: TourClasses;
  accent: string;
  labels: { title: string; middle: string; luxury: string; preparing: string };
}) {
  const [active, setActive] = useState<FishingClassKey>('middle');
  const current = classes[active];
  const tabLabel: Record<FishingClassKey, string> = { middle: labels.middle, luxury: labels.luxury };
  const hasContent = Boolean(current.image?.trim() || current.description?.trim());

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <h2 className="font-serif text-xl text-white">{labels.title}</h2>

      {/* 탭 버튼 (미들 / 럭셔리) */}
      <div
        role="tablist"
        aria-label={labels.title}
        className="mt-4 inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1"
      >
        {FISHING_CLASS_KEYS.map((key) => {
          const selected = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(key)}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-colors"
              style={
                selected
                  ? { backgroundColor: accent, color: '#06202f' }
                  : { color: 'rgba(255,255,255,0.7)' }
              }
            >
              {tabLabel[key]}
            </button>
          );
        })}
      </div>

      {/* 활성 탭 콘텐츠 (사진 + 설명) */}
      <div className="mt-5">
        {hasContent ? (
          <div className="space-y-5">
            {current.image?.trim() && (
              <div className="overflow-hidden rounded-card border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cdnMedia(current.image)}
                  alt={tabLabel[active]}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            )}
            {current.description?.trim() && (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/80">
                {current.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed text-white/60">{labels.preparing}</p>
        )}
      </div>
    </section>
  );
}
