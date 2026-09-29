import { z } from 'zod';
import { ACTIVITIES, type Activity } from '@/components/ocean-home-data';
import { activeOptions, localizeOptions, parseTourOptions, type ReserveOption, type TourOption } from './tour-options';

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
 * 요금 방식 — 투어마다 계산법이 다르다.
 *   text      : 가격 안내 글 그대로(계산 없음, 기본값 — 기존 데이터 전부)
 *   perPerson : 1인당 요금(+1인 단독 요금) — 스노클링·체험다이빙
 *   boat      : 배 1척 · 인원 구간별 — 낚시·요트
 *   inquiry   : 가격 문의
 * 숫자 요금이 있을 때만 예약 카드가 인원별 예상 합계를 계산한다.
 */
export const PRICE_MODES = ['text', 'perPerson', 'boat', 'inquiry'] as const;
export type PriceMode = (typeof PRICE_MODES)[number];

/** 배 1척 요금 구간 — "최대 maxPeople명까지 price엔". cls 빈 값 = 모든 클래스 공통. */
export const PriceTierSchema = z.object({
  cls: z.string().default(''),
  maxPeople: z.number().int().positive(),
  price: z.number().nonnegative()
});
export type PriceTier = z.infer<typeof PriceTierSchema>;

/** 진행 순서 1단계. */
export const TourStepSchema = z.object({
  name: z.string().default(''),
  time: z.string().default('')
});
export type TourStepInput = z.infer<typeof TourStepSchema>;

/**
 * 2026-09 추가 필드는 모두 선택 입력 + `.catch()` — 한 필드가 잘못 저장돼도 상세 전체가
 * 빈 값으로 무너지지 않게 한다(parseTourDetail 은 실패 시 전체를 비우므로).
 */
const optionalNumber = z.number().nonnegative().nullable().default(null).catch(null);

/**
 * 어드민이 등록하는 상세 콘텐츠. site_content `tour:{slug}` 의 value.
 * published=false 면 상세 본문은 비공개(페이지는 기본 정보 + 예약 문의만 노출).
 * (클래스(미들/럭셔리)는 투어별이 아닌 낚시 공통이므로 여기 포함하지 않는다 — fishing_classes 키 참조.)
 */
export const TourDetailSchema = z.object({
  summary: z.string().default(''), // 상단 한 줄 요약
  heroImage: z.string().default(''), // (구) 단일 상단 이미지 — images 폴백·어드민 목록 판정용. 저장 시 images[0]과 동기화
  images: z.array(z.string()).default([]), // 상세 갤러리 사진 URL 목록(첫 장 = 대표). 언어 중립 — 공개 페이지는 ko 키 값만 사용
  duration: z.string().default(''), // 소요 시간
  price: z.string().default(''), // 가격 안내(단일 텍스트 — 클래스별 가격 미입력 시 폴백 표시)
  priceMiddle: z.string().default(''), // 낚시 미들 클래스 가격 — 입력 시 클래스 선택에 따라 전환 표시
  priceLuxury: z.string().default(''), // 낚시 럭셔리 클래스 가격
  included: z.string().default(''), // 포함 사항(줄바꿈 구분)
  body: z.string().default(''), // 상세 본문(여러 단락) — 표기법은 lib/tour-body 참조
  published: z.boolean().default(false),
  // ── 2026-09 구조화 입력(모두 선택) ──
  priceMode: z.enum(PRICE_MODES).default('text').catch('text'),
  pricePerPerson: optionalNumber, // perPerson: 2인 이상 1인 요금(엔)
  priceSolo: optionalNumber, // perPerson: 1인 단독 참가 요금(엔)
  priceTiers: z.array(PriceTierSchema).default([]).catch([]), // boat: 인원 구간
  age: z.string().default('').catch(''), // 참가 연령 표시 — 비면 본문에서 추출
  people: z.string().default('').catch(''), // 인원 안내(예: 2인부터 · 1인 가능)
  startNote: z.string().default('').catch(''), // 출발 안내(자유 출발형 등) — 투어 시간대가 없을 때 표시
  steps: z.array(TourStepSchema).default([]).catch([]), // 진행 순서 — 비면 본문의 '->' 흐름 사용
  notices: z.array(z.string()).default([]).catch([]), // 켜 둔 공통 안내 id(lib/tour-notices)
  options: z.unknown().transform(parseTourOptions) // 선택 옵션(lib/tour-options) — 형식이 틀린 항목만 건너뜀
});
export type TourDetail = z.infer<typeof TourDetailSchema>;

export function emptyTourDetail(): TourDetail {
  return {
    summary: '',
    heroImage: '',
    images: [],
    duration: '',
    price: '',
    priceMiddle: '',
    priceLuxury: '',
    included: '',
    body: '',
    published: false,
    priceMode: 'text',
    pricePerPerson: null,
    priceSolo: null,
    priceTiers: [],
    age: '',
    people: '',
    startNote: '',
    steps: [],
    notices: [],
    options: []
  };
}

/** 선택 클래스의 가격 텍스트(미입력 시 ''). 두 클래스 모두 비었을 때의 price 폴백은 호출부 몫. */
export function classPrice(detail: TourDetail, key: FishingClassKey): string {
  return (key === 'middle' ? detail.priceMiddle : detail.priceLuxury).trim();
}

/** 표시용 사진 목록 해석 — images 우선, 비어 있으면 heroImage 1장 폴백(구 데이터 하위 호환). */
export function tourImages(detail: TourDetail): string[] {
  if (detail.images.length > 0) return detail.images;
  return detail.heroImage ? [detail.heroImage] : [];
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
      '오키나와 본섬에서 출항해 에메랄드빛 케라마 해역까지, 다른 일행 없이 우리 팀만을 위한 전세 요트 크루징입니다.\n\n선상에서 즐기는 스노클링과 선셋, 그리고 셰프가 준비하는 온보드 다이닝까지 — 기념일·프로포즈·가족 여행 등 특별한 하루를 프라이빗하게 설계해 드립니다.\n\n인원·코스·식사 구성은 자유롭게 조율 가능합니다. 원하는 일정과 인원을 남겨 주시면 카카오톡 채널로 맞춤 견적을 안내해 드립니다.'
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

/**
 * 상세 공개 여부 — 언어 공통 값이라 한국어 저장본(base)만 본다.
 * 번역본마다 따로 보면 한국어에서 비공개로 바꿔도 EN/JA 는 계속 공개·예약되는 일이 생긴다.
 */
export function isTourPublished(base: TourDetail): boolean {
  return base.published;
}

/**
 * 손님이 고를 수 있는 옵션 — 요금·순서는 한국어 저장본(base), 이름·설명은 그 언어 저장본(local).
 * 상세가 공개된 투어만, 낚시는 제외(미들/럭셔리 클래스로 고른다). 투어 페이지·예약 폼 공용.
 */
export function bookableOptions(slug: string, base: TourDetail, local: TourDetail): TourOption[] {
  if (tourHasClasses(slug) || !isTourPublished(base)) return [];
  return activeOptions(localizeOptions(base.options, local.options));
}

/**
 * 예약 폼 옵션(투어별) — 홈 예약 섹션·예약 페이지 공용. docs(slug) 는 그 투어의 한국어 저장본(base)과
 * 이 언어 저장본(local, 없으면 한국어)을 돌려준다. 예약 기록(productLabel)은 운영자가 읽는 한국어 이름.
 * 옵션 없는 투어는 키를 만들지 않는다.
 */
export function reserveOptionsFor(
  docs: (slug: string) => { base: unknown; local: unknown }
): Record<string, ReserveOption[]> {
  const out: Record<string, ReserveOption[]> = {};
  for (const t of TOUR_CATALOG) {
    const { base: rawBase, local: rawLocal } = docs(t.slug);
    const base = resolveTourDetail(t.slug, rawBase ?? null);
    const local = resolveTourDetail(t.slug, rawLocal ?? rawBase ?? null);
    const opts = bookableOptions(t.slug, base, local);
    if (!opts.length) continue;
    out[t.slug] = opts.map((o) => ({
      key: o.key,
      label: o.name,
      productLabel: base.options.find((b) => b.key === o.key)?.name.trim() || o.name,
      pricePerPerson: o.pricePerPerson,
      minPeople: o.minPeople,
      maxPeople: o.maxPeople
    }));
  }
  return out;
}

/**
 * 목록 글 → 항목들(포함 사항 등). 여러 줄로 썼으면 줄마다 한 항목(문장 안의 쉼표는 그대로 둔다 —
 * "숙소 픽업, 드랍"이 두 칸으로 쪼개지지 않게). 한 줄로 썼으면 쉼표로 나누되, 숫자 사이(10,000)와
 * 괄호 안의 쉼표는 나누지 않는다.
 */
export function splitLines(value: string): string[] {
  const lines = value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length === 1 ? splitCommaList(lines[0]) : lines;
}

function splitCommaList(line: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '(' || ch === '（') depth++;
    else if ((ch === ')' || ch === '）') && depth > 0) depth--;
    const betweenDigits = /\d/.test(line[i - 1] ?? '') && /\d/.test(line[i + 1] ?? '');
    if (ch === ',' && depth === 0 && !betweenDigits) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

// ── 요약 타일 · 예약 카드용 도메인 계산 ──────────────────────────────

export type AgeRange = { min: number; max: number };

const AGE_PATTERNS = [
  /만\s?(\d{1,2})\s?세\s?부터\s?만?\s?(\d{1,2})\s?세/, // ko: 만10세부터 만55세
  /(\d{1,2})\s?歳から\s?(\d{1,2})\s?歳/, // ja: 10歳から55歳
  /between\s+(\d{1,2})\s+and\s+(\d{1,2})\s+years?\s+old/i // en
];

/** 본문에서 참가 연령 범위를 찾는다(요약 타일의 폴백). 없으면 null. */
export function extractAgeRange(body: string): AgeRange | null {
  for (const re of AGE_PATTERNS) {
    const m = re.exec(body ?? '');
    if (m) {
      const min = Number(m[1]);
      const max = Number(m[2]);
      if (min < max) return { min, max };
    }
  }
  return null;
}

/** 예약 카드 계산에 필요한 요금 필드만 — 클라이언트로 상세 전체를 넘기지 않기 위해. */
export type TourPricing = Pick<TourDetail, 'priceMode' | 'pricePerPerson' | 'priceSolo' | 'priceTiers'>;

/** 선택 클래스에 적용되는 요금 구간(최대 인원 오름차순). */
function tiersFor(detail: TourPricing, cls: string): PriceTier[] {
  return detail.priceTiers
    .filter((t) => !t.cls || t.cls === cls)
    .sort((a, b) => a.maxPeople - b.maxPeople);
}

/**
 * 인원별 예상 합계(엔). 숫자 요금이 없거나 계산할 수 없으면 null.
 * perPerson: 1인이면 단독 요금(없으면 1인 요금), 2인 이상은 1인 요금 × 인원.
 * boat: 인원을 담는 가장 작은 구간의 배 1척 요금. 최대 인원 초과면 null.
 */
export function estimateTotal(detail: TourPricing, people: number, cls: string = ''): number | null {
  if (!Number.isFinite(people) || people < 1) return null;
  if (detail.priceMode === 'perPerson') {
    if (people === 1 && detail.priceSolo != null) return detail.priceSolo;
    return detail.pricePerPerson == null ? null : detail.pricePerPerson * people;
  }
  if (detail.priceMode === 'boat') {
    return tiersFor(detail, cls).find((t) => people <= t.maxPeople)?.price ?? null;
  }
  return null;
}

/** 표시용 시작가(엔). perPerson=1인 요금, boat=해당 클래스 최저 구간. */
export function startingPrice(detail: TourPricing, cls: string = ''): number | null {
  if (detail.priceMode === 'perPerson') return detail.pricePerPerson ?? detail.priceSolo;
  if (detail.priceMode === 'boat') {
    const prices = tiersFor(detail, cls).map((t) => t.price);
    return prices.length ? Math.min(...prices) : null;
  }
  return null;
}

/** 예약 가능한 최대 인원(boat 구간 기준). 제한이 없으면 null. */
export function maxPeopleOf(detail: TourPricing, cls: string = ''): number | null {
  if (detail.priceMode !== 'boat') return null;
  const tiers = tiersFor(detail, cls);
  return tiers.length ? tiers[tiers.length - 1].maxPeople : null;
}

/** 엔 → 원 참고 금액(천 원 단위 반올림). */
export function approxKrw(yen: number, jpyKrw: number): number {
  return Math.round((yen * jpyKrw) / 1000) * 1000;
}

/** 투어 상세 예약 카드가 넘긴 인원(?people=) — 예약 폼 입력 범위(1~50) 안의 정수만 받는다. */
export function parsePeopleParam(raw: string | null): number | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= 1 && n <= 50 ? n : undefined;
}
