/**
 * 투어별 기준 단가 — 운영 보드 예상매출(단가×인원) 계산용. 어드민 전용, 고객 비노출.
 * site_content `tour_prices` 키. value: { prices: { [slug]: number } }(원 단위 정수).
 * 범용 모듈(server-only 의존 없음).
 */

import { ACTIVITIES } from '@/components/ocean-home-data';
import { TOUR_CATALOG } from './tour';

export type TourPrices = Record<string, number>;

/** 예약 product 표시문자열("대분류 · 세부") → 대분류 색 accent + 단가용 slug. */
export function tourMeta(product?: string): { accent: string; slug: string | null } {
  if (!product) return { accent: '#64748b', slug: null };
  const a = ACTIVITIES.find((x) => product.startsWith(x.title));
  const namePart = product.includes(' · ') ? product.split(' · ').slice(1).join(' · ') : '';
  const entry = TOUR_CATALOG.find((t) => t.name === namePart);
  return { accent: a?.accent ?? '#64748b', slug: entry?.slug ?? null };
}

/** site_content 값을 안전 파싱 → { slug: 단가 }. 음수·비정상 값은 제외. */
export function parseTourPrices(raw: unknown): TourPrices {
  const out: TourPrices = {};
  if (!raw || typeof raw !== 'object') return out;
  const prices = (raw as { prices?: unknown }).prices;
  if (!prices || typeof prices !== 'object') return out;
  for (const [slug, v] of Object.entries(prices as Record<string, unknown>)) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n) && n >= 0) out[slug] = Math.round(n);
  }
  return out;
}

/** 예상매출 = 단가 × 인원. 단가 없으면 null. */
export function estimateRevenue(prices: TourPrices, slug: string, people: number | undefined): number | null {
  const unit = prices[slug];
  if (unit == null || !people) return null;
  return unit * people;
}
