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
 * slug → nav 네임스페이스 번역 키(표시명). 카탈로그 한국어명(canonical, 운영자/문의용)과 별개로
 * 고객 화면의 다국어 투어명 표시에 사용한다. (예약 폼 옵션·투어 상세 헤더 공용)
 */
export const TOUR_NAME_NAV_KEY: Record<string, string> = {
  'blue-cave-snorkeling': 'tours.snorkeling.cave',
  'blue-cave-dive': 'tours.diving.cave',
  'kerama-dive': 'tours.diving.kerama',
  'fun-dive': 'tours.diving.fun',
  'ow-course': 'tours.padi.ow',
  'aow-course': 'tours.padi.aow',
  'owaow-course': 'tours.padi.owaow',
  'specialty-course': 'tours.padi.specialty',
  'trial-fishing-4h': 'tours.fishing.trial4',
  'fishing-5species-6h': 'tours.fishing.five6',
  'overnight-fishing': 'tours.fishing.overnight',
  'biggame-trolling-8h': 'tours.fishing.biggame8',
  'luxury-yacht-cruise': 'tours.yacht.luxury',
  'middle-yacht-cruise': 'tours.yacht.middle'
};

/**
 * 낚시 소분류(클래스) — 중분류(투어)별로 별도 페이지를 만들지 않고, 각 낚시 투어 상세에
 * '클래스' 탭(미들/럭셔리)으로 사진+설명을 노출한다. key는 콘텐츠 저장·탭 식별용 고정값,
 * 표시 라벨은 로케일별(reservation/tourDetail 네임스페이스의 classMiddle·classLuxury).
 */
export const FISHING_CLASS_KEYS = ['middle', 'luxury'] as const;
export type FishingClassKey = (typeof FISHING_CLASS_KEYS)[number];

/** 어떤 투어가 클래스(소분류) 탭을 갖는지 — 현재는 낚시 카테고리 전체. */
export function tourHasClasses(slug: string): boolean {
  return getTourCatalogEntry(slug)?.categoryId === 'fishing';
}

/** 낚시 클래스(소분류) 1종의 콘텐츠 — 사진 + 설명. (탭별로 독립 저장) */
export const TourClassSchema = z.object({
  image: z.string().default(''),
  description: z.string().default('')
});
export type TourClass = z.infer<typeof TourClassSchema>;

/** 낚시 클래스 묶음 — 미들/럭셔리 고정 2종. */
export const TourClassesSchema = z
  .object({
    middle: TourClassSchema.default({ image: '', description: '' }),
    luxury: TourClassSchema.default({ image: '', description: '' })
  })
  .default({ middle: { image: '', description: '' }, luxury: { image: '', description: '' } });
export type TourClasses = z.infer<typeof TourClassesSchema>;

export function emptyTourClasses(): TourClasses {
  return { middle: { image: '', description: '' }, luxury: { image: '', description: '' } };
}

/**
 * 낚시 클래스(미들/럭셔리)는 투어별이 아니라 **낚시 전체 공통**이다.
 * site_content `fishing_classes` 단일 키에 저장 → 한 곳에서 수정하면 4개 낚시 투어 상세에 모두 반영(동기화).
 */
export function parseFishingClasses(raw: unknown): TourClasses {
  const parsed = TourClassesSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : emptyTourClasses();
}

/**
 * 어드민이 등록하는 상세 콘텐츠. site_content `tour:{slug}` 의 value.
 * published=false 면 상세 본문은 비공개(페이지는 기본 정보 + 예약 문의만 노출).
 * (클래스(미들/럭셔리)는 투어별이 아닌 낚시 공통이므로 여기 포함하지 않는다 — fishing_classes 키 참조.)
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

/**
 * 코드 레벨 기본 상세 — DB에 해당 투어 콘텐츠가 아직 없을 때 노출할 선공개 값.
 * (운영 DB 직접 쓰기 없이 "공개+작성" 상태를 코드로 제공. 어드민이 저장하면 DB 값이 이를 덮어쓴다.)
 * 홈 콘텐츠의 "코드 기본값 + DB 오버라이드" 정책과 동일한 철학.
 */
export const TOUR_DETAIL_DEFAULTS: Record<string, TourDetail> = {
  'luxury-yacht-cruise': {
    ...emptyTourDetail(),
    published: true,
    summary: '전세 요트로 떠나는 프라이빗 럭셔리 크루징 — 일행만을 위한 케라마 블루.',
    heroImage: '/images/ph-5.svg',
    duration: '약 6시간 (반일~종일 선택)',
    price: '문의 시 맞춤 견적 안내',
    included:
      '전세 요트 단독 이용\n선장·전문 크루 동행\n스노클링 장비 일체\n온보드 음료·다과\n주요 숙소 무료 픽업',
    body:
      '오키나와 본섬에서 출항해 에메랄드빛 케라마 해역까지, 다른 일행 없이 우리 팀만을 위한 전세 요트 크루징입니다.\n\n선상에서 즐기는 스노클링과 선셋, 그리고 셰프가 준비하는 온보드 다이닝까지 — 기념일·프로포즈·가족 여행 등 특별한 하루를 프라이빗하게 설계해 드립니다.\n\n인원·코스·식사 구성은 자유롭게 조율 가능합니다. 원하는 일정과 인원을 남겨 주시면 24시간 안에 한국어로 맞춤 견적을 안내해 드립니다.'
  }
};

/**
 * DB 값(raw)이 없을 때(키 부재) 코드 기본값으로 폴백해 상세를 해석한다.
 * raw 가 존재하면(어드민이 한 번이라도 저장했으면) DB 값을 우선한다.
 */
export function resolveTourDetail(slug: string, raw: unknown): TourDetail {
  if (raw == null && TOUR_DETAIL_DEFAULTS[slug]) return TOUR_DETAIL_DEFAULTS[slug];
  return parseTourDetail(raw);
}

/** 줄바꿈/쉼표로 구분된 문자열을 리스트로(포함 사항 등). */
export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}
