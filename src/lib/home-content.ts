import { z } from 'zod';

/**
 * 홈(OceanHome) 섹션의 어드민 오버라이드 — site_content 키별 값의 스키마/파서.
 * 순수 모듈(server-only 의존 없음): 서버(page.tsx 파싱)·클라이언트(어드민 폼 타입)에서 공용.
 *
 * 적용 규칙: 오버라이드는 운영자 입력(한국어)이므로 기본 로케일(ko)에만 적용한다.
 * en/ja는 i18n 번역(messages/*.json)을 그대로 사용 → 다국어 회귀 없음. (Hero 오버라이드와 동일 정책)
 */

/** 어드민 홈 콘텐츠 site_content 키(클라이언트 폼에서도 임포트 가능하도록 순수 상수). */
export const HOME_CONTENT_KEYS = {
  testimonials: 'home_testimonials',
  assurances: 'home_assurances',
  tourCopy: 'home_tour_copy'
} as const;

// ── 후기 ─────────────────────────────────────────────────────────────
export const TestimonialItemSchema = z.object({
  name: z.string().default(''),
  city: z.string().default(''),
  tour: z.string().default(''),
  quote: z.string().default('')
});
export type TestimonialItem = z.infer<typeof TestimonialItemSchema>;

export const HomeTestimonialsSchema = z.object({
  sectionTitle: z.string().default(''),
  items: z.array(TestimonialItemSchema).default([])
});
export type HomeTestimonials = z.infer<typeof HomeTestimonialsSchema>;

export function parseHomeTestimonials(raw: unknown): HomeTestimonials {
  const p = HomeTestimonialsSchema.safeParse(raw ?? {});
  return p.success ? p.data : { sectionTitle: '', items: [] };
}

// ── 신뢰(왜 우리인가) ────────────────────────────────────────────────
export const AssuranceItemSchema = z.object({
  title: z.string().default(''),
  desc: z.string().default('')
});
export type AssuranceItem = z.infer<typeof AssuranceItemSchema>;

export const HomeAssurancesSchema = z.object({
  sectionTitle: z.string().default(''),
  items: z.array(AssuranceItemSchema).default([])
});
export type HomeAssurances = z.infer<typeof HomeAssurancesSchema>;

export function parseHomeAssurances(raw: unknown): HomeAssurances {
  const p = HomeAssurancesSchema.safeParse(raw ?? {});
  return p.success ? p.data : { sectionTitle: '', items: [] };
}

// ── 투어 카드 카피(홈 캐러셀의 텍스트) ───────────────────────────────
// cards 는 활동 id(snorkeling·diving·padi·fishing) → {title,tagline,desc}.
export const TourCardCopySchema = z.object({
  title: z.string().default(''),
  tagline: z.string().default(''),
  desc: z.string().default('')
});
export type TourCardCopy = z.infer<typeof TourCardCopySchema>;

export const HomeTourCopySchema = z.object({
  sectionTitle: z.string().default(''),
  sectionIntro: z.string().default(''),
  cards: z.record(z.string(), TourCardCopySchema).default({})
});
export type HomeTourCopy = z.infer<typeof HomeTourCopySchema>;

export function parseHomeTourCopy(raw: unknown): HomeTourCopy {
  const p = HomeTourCopySchema.safeParse(raw ?? {});
  return p.success ? p.data : { sectionTitle: '', sectionIntro: '', cards: {} };
}

/** 빈 문자열을 제거해 "값이 있을 때만 오버라이드"가 되도록(없으면 i18n 기본값 사용). */
export function nonEmpty(s: string | undefined | null): string | undefined {
  const v = (s ?? '').trim();
  return v ? v : undefined;
}
