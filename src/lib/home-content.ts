import { z } from 'zod';
import { localizedContentKey } from './content-read';

/**
 * 홈(OceanHome) 섹션의 어드민 오버라이드 — site_content 키별 값의 스키마/파서.
 * 순수 모듈(server-only 의존 없음): 서버(page.tsx 파싱)·클라이언트(어드민 폼 타입)에서 공용.
 *
 * 적용 규칙: 운영자는 한국어로 입력하고, 저장하면 EN/JA 번역본(`키:en`·`키:ja`)이 자동으로 만들어진다
 * (lib/content-sync — Hero·투어 카드·신뢰 영역). EN/JA 홈은 번역본이 있을 때만 그것을 쓰고, 없으면
 * i18n 기본 문구(messages/*.json). 후기는 손님이 쓴 글이라 번역하지 않고 한국어 홈에만 쓴다.
 */

/**
 * 언어별 홈 문구 문서 — 한국어는 기본 키, EN/JA 는 번역본 키만(한국어로 대신하지 않는다:
 * 번역 전에는 EN/JA 홈에 한국어가 섞이지 않게 i18n 기본 문구를 쓴다).
 */
export function homeTextDoc(map: Record<string, unknown>, key: string, locale: string): unknown {
  return map[localizedContentKey(key, locale)] ?? undefined;
}

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
