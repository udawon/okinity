import { z } from 'zod';
import { ACTIVITIES, type Activity } from '@/components/ocean-home-data';

/**
 * 투어 상세 — 목록(어떤 투어가 있는지)은 코드 카탈로그(ACTIVITIES.tours)로 고정,
 * 각 투어의 상세 내용만 어드민에서 site_content `tour:{slug}` 키에 등록한다.
 * 범용 모듈(server-only 의존 없음).
 */

/** 코드 카탈로그 항목 — slug ↔ 표시명 + 소속 카테고리 정보. */
export type TourCatalogEntry = {
  slug: string;
  name: string;
  categoryId: Activity['id'];
  categoryTitle: string;
  categoryKicker: string;
  accent: string;
};

/** 전체 하위 투어를 평탄화한 카탈로그(카테고리 순서 유지). */
export const TOUR_CATALOG: TourCatalogEntry[] = ACTIVITIES.flatMap((a) =>
  a.tours.map((t) => ({
    slug: t.slug,
    name: t.name,
    categoryId: a.id,
    categoryTitle: a.title,
    categoryKicker: a.kicker,
    accent: a.accent
  }))
);

/** slug 로 카탈로그 항목 조회(없으면 undefined). */
export function getTourCatalogEntry(slug: string): TourCatalogEntry | undefined {
  return TOUR_CATALOG.find((t) => t.slug === slug);
}

/**
 * 어드민이 등록하는 상세 콘텐츠. site_content `tour:{slug}` 의 value.
 * published=false 면 상세 본문은 비공개(페이지는 기본 정보 + 예약 문의만 노출).
 */
export const TourDetailSchema = z.object({
  summary: z.string().default(''), // 상단 한 줄 요약
  heroImage: z.string().default(''), // 상세 상단 이미지 URL
  duration: z.string().default(''), // 소요 시간
  price: z.string().default(''), // 가격 안내
  included: z.string().default(''), // 포함 사항(줄바꿈 구분)
  body: z.string().default(''), // 상세 본문(여러 단락)
  published: z.boolean().default(false)
});
export type TourDetail = z.infer<typeof TourDetailSchema>;

export function emptyTourDetail(): TourDetail {
  return {
    summary: '',
    heroImage: '',
    duration: '',
    price: '',
    included: '',
    body: '',
    published: false
  };
}

/** site_content 값을 안전 파싱(실패 시 빈 상세). */
export function parseTourDetail(raw: unknown): TourDetail {
  const parsed = TourDetailSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : emptyTourDetail();
}

/** 줄바꿈/쉼표로 구분된 문자열을 리스트로(포함 사항 등). */
export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}
