import { z } from 'zod';
import type { TourPricing } from './tour';

/**
 * 투어 선택 옵션 — 한 투어를 진행 방식별로 나눠 손님이 고르게 한다(예: 푸른동굴 스노클링 일반 / 프라이빗).
 * 어드민 투어 상세에서 투어마다 등록한다. 요금·최소 인원·key 는 언어 공통(한국어 저장본),
 * 이름·설명만 언어별 저장본의 같은 key 로 덮는다. 범용 모듈(server-only 의존 없음).
 * (낚시 미들/럭셔리 클래스는 낚시 4종 공통이라 별도 — lib/tour 의 fishing_classes.)
 */
export const TourOptionSchema = z.object({
  key: z.string().min(1).max(24), // 식별용 고정값(?option= · 번역 연결). 어드민이 만들 때 자동 생성
  name: z.string().default(''),
  description: z.string().default(''), // 줄마다 한 항목
  pricePerPerson: z.number().nonnegative().nullable().default(null).catch(null), // 1인 요금(엔)
  minPeople: z.number().int().min(1).max(50).nullable().default(null).catch(null), // 최소 인원(없으면 1명)
  maxPeople: z.number().int().min(1).max(50).nullable().default(null).catch(null) // 최대 인원(없으면 제한 없음. 예: 1인 단독 = 1)
});
export type TourOption = z.infer<typeof TourOptionSchema>;

/** 저장값 안전 파싱 — 목록이 아니면 빈 목록, 형식이 틀린 항목은 건너뛴다. */
export function parseTourOptions(raw: unknown): TourOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = TourOptionSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** 손님에게 보여줄 옵션 — 이름 있는 것만, 2개 이상일 때만(1개면 고를 게 없으니 숨김). */
export function activeOptions(options: TourOption[]): TourOption[] {
  const named = options.filter((o) => o.name.trim());
  return named.length >= 2 ? named : [];
}

/** 언어별 옵션 — 한국어 저장본 순서·요금 그대로, 이름·설명만 같은 key 의 번역(비어 있으면 한국어). */
export function localizeOptions(base: TourOption[], local: TourOption[] | undefined): TourOption[] {
  if (!local?.length) return base;
  return base.map((o) => {
    const l = local.find((x) => x.key === o.key);
    if (!l) return o;
    return {
      ...o,
      name: l.name.trim() || o.name,
      description: l.description.trim() || o.description
    };
  });
}

export function findOption<T extends { key: string }>(options: T[], key: string | null | undefined): T | undefined {
  return key ? options.find((o) => o.key === key) : undefined;
}

export function optionMinPeople(option: Pick<TourOption, 'minPeople'> | null | undefined): number {
  return option?.minPeople ?? 1;
}

/**
 * 옵션의 인원 범위 — 최소(없으면 1명) ~ 최대(없으면 fallbackMax).
 * 최대가 최소보다 작게 저장돼 있으면(어드민 검증 이전 값) 최소 인원만 받는다.
 */
export function optionPeopleRange(
  option: Pick<TourOption, 'minPeople' | 'maxPeople'> | null | undefined,
  fallbackMax = 50
): { min: number; max: number } {
  const min = optionMinPeople(option);
  const max = option?.maxPeople ?? fallbackMax;
  return { min, max: Math.max(min, max) };
}

/** 손님에게 보여줄 인원 규칙 — "N명부터" / "N~M명" / "N명만". */
export type PeopleRule = { kind: 'from'; n: number } | { kind: 'range'; min: number; max: number } | { kind: 'only'; n: number };

export function optionPeopleRule(option: Pick<TourOption, 'minPeople' | 'maxPeople'>): PeopleRule {
  const min = optionMinPeople(option);
  if (option.maxPeople == null) return { kind: 'from', n: min };
  const { max } = optionPeopleRange(option);
  return max === min ? { kind: 'only', n: min } : { kind: 'range', min, max };
}

export function clampPeople(people: number, min: number, max: number): number {
  return Math.min(Math.max(people, min), max);
}

/**
 * 고른 옵션에 1인 요금이 있으면 "1인 요금 × 인원"으로 계산(투어의 요금 방식·1인 단독 요금 대신).
 * 옵션 요금이 비어 있으면 투어 요금을 그대로 쓴다.
 */
export function pricingWithOption(
  pricing: TourPricing,
  option: Pick<TourOption, 'pricePerPerson'> | null | undefined
): TourPricing {
  if (option?.pricePerPerson == null) return pricing;
  return { priceMode: 'perPerson', pricePerPerson: option.pricePerPerson, priceSolo: null, priceTiers: [] };
}

/** 예약 폼용 옵션 — 손님 언어 이름(label) + 예약 기록에 남길 한국어 이름(productLabel). */
export type ReserveOption = {
  key: string;
  label: string;
  productLabel: string;
  pricePerPerson: number | null;
  minPeople: number | null;
  maxPeople: number | null;
};

/** 새 옵션 key — 지운 옵션의 key 를 다시 쓰지 않도록 시각 기반(번역본에 남은 옛 key 와 겹치지 않게). */
export function newOptionKey(existing: string[], now: number = Date.now()): string {
  let n = now;
  let key = `o${n.toString(36)}`;
  while (existing.includes(key)) key = `o${(++n).toString(36)}`;
  return key;
}
