import { ACTIVITIES } from '@/components/ocean-home-data';

/**
 * 예약 기록의 상품명 — "대분류 · 투어명 · 옵션(또는 낚시 클래스)" 한 줄(운영자가 읽는 한국어).
 * 옵션을 DB 칼럼으로 따로 두지 않고 이 글에 담는다 → 예약 폼·어드민(수정 창·운영 보드)이
 * 모두 이 모듈로 만들고 읽어서 형식이 어긋나지 않게 한다. 범용 모듈(server-only 의존 없음).
 */
export const PRODUCT_SEP = ' · ';

export type ParsedProduct = { catId: string; slug: string; extra: string };

/** 대분류가 없으면 빈 값(투어명·옵션만으로는 만들지 않는다). 비어 있는 부분은 건너뛴다. */
export function buildProduct(categoryTitle: string, tourName?: string, extra?: string): string {
  if (!categoryTitle) return '';
  return [categoryTitle, tourName?.trim(), extra?.trim()].filter(Boolean).join(PRODUCT_SEP);
}

/** 상품명 → 대분류 id · 투어 slug · 나머지(옵션/클래스). 모르는 부분은 빈 값. */
export function parseProduct(product?: string): ParsedProduct {
  const empty = { catId: '', slug: '', extra: '' };
  if (!product) return empty;
  const a = ACTIVITIES.find((x) => product === x.title || product.startsWith(x.title + PRODUCT_SEP));
  if (!a) return empty;
  const rest = product.slice(a.title.length + PRODUCT_SEP.length);
  // 긴 이름부터 — 한 투어명이 다른 투어명의 앞부분이어도 정확한 쪽을 고른다.
  const tour = [...a.tours]
    .sort((x, y) => y.name.length - x.name.length)
    .find((t) => rest === t.name || rest.startsWith(t.name + PRODUCT_SEP));
  if (!tour) return { ...empty, catId: a.id };
  return { catId: a.id, slug: tour.slug, extra: rest.slice(tour.name.length + PRODUCT_SEP.length) };
}
