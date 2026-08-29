'use client';

import { useState, type ReactNode } from 'react';
import { cdnMedia } from '@/lib/media';
import { FISHING_CLASS_KEYS, type FishingClassKey, type TourClasses } from '@/lib/tour';
import ReserveCta from './ReserveCta';

/**
 * 낚시 투어 상세의 클래스 종속 구획 — 상단 세그먼트에서 미들/럭셔리를 먼저 고르면
 * 가격(메타)·요트 사진+스펙이 함께 전환되고, 선택은 예약 CTA(?class=)까지 이어진다.
 * 공통 본문(포함 사항·상세)은 children으로 받아 서버 렌더 그대로 사이에 끼워 넣는다.
 * 소분류(클래스)는 별도 페이지를 두지 않는다는 원칙은 기존 탭과 동일.
 */
export default function TourClassSection({
  classes,
  prices,
  duration,
  showMeta,
  slug,
  accent,
  labels,
  children
}: {
  classes: TourClasses;
  /** middle/luxury 는 클래스별 가격(빈 값 가능), fallback 은 기존 단일 가격 안내 텍스트. */
  prices: { middle: string; luxury: string; fallback: string };
  duration: string;
  /** 상세 공개(published) 여부 — 메타(소요·가격) 노출 조건(클래스 구획 자체는 공개 무관 상시). */
  showMeta: boolean;
  slug: string;
  accent: string;
  labels: {
    title: string;
    middle: string;
    luxury: string;
    preparing: string;
    durationLabel: string;
    priceLabel: string;
    reserveCta: string;
  };
  children?: ReactNode;
}) {
  const [active, setActive] = useState<FishingClassKey>('middle');
  const current = classes[active];
  const tabLabel: Record<FishingClassKey, string> = { middle: labels.middle, luxury: labels.luxury };
  const hasContent = Boolean(current.image?.trim() || current.description?.trim());
  // 클래스별 가격이 하나라도 입력돼 있으면 선택에 따라 전환, 모두 비면 기존 단일 안내로 고정(폴백).
  const classPricing = Boolean(prices.middle || prices.luxury);
  const price = classPricing ? prices[active] : prices.fallback;

  const meta = [
    duration && { label: labels.durationLabel, value: duration },
    price && { label: labels.priceLabel, value: price }
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* 클래스 세그먼트 — 진입 직후 가장 먼저 만나는 선택(기본: 미들) */}
      <div className="mt-7">
        <div className="text-[11px] uppercase tracking-wider text-white/55">{labels.title}</div>
        <div
          role="tablist"
          aria-label={labels.title}
          className="mt-2 inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1"
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
                <span className="block">{tabLabel[key]}</span>
                {classPricing && prices[key] && (
                  <span className={`block text-[11px] font-medium ${selected ? '' : 'text-white/45'}`}>
                    {prices[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 메타(소요·선택 클래스 가격) — 비공개 투어는 숨김(기존 노출 규칙 유지) */}
      {showMeta && meta.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5">
          {meta.map((m) => (
            <div key={m.label}>
              <div className="text-[11px] uppercase tracking-wider text-white/55">{m.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-white">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 선택 클래스의 요트 사진 + 스펙 */}
      <div className="mt-8">
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

      {children}

      <ReserveCta href={`/reserve?tour=${slug}&class=${active}`} label={labels.reserveCta} />
    </>
  );
}
