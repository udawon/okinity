import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { routing, type Locale } from '@/i18n/routing';

/**
 * 콘텐츠 레이어 — 상품 정보를 코드가 아닌 마크다운 파일에서 읽는다.
 *
 * content/{locale}/products/{slug}.md 구조.
 * 프론트매터(frontmatter)는 zod로 검증해 오타·누락을 빌드/요청 시 잡는다.
 * 마크다운 본문(긴 설명)은 페이지에서 react-markdown으로 렌더.
 *
 * "콘텐츠를 md로 교체"라는 요구를 이 파일이 실현한다. 비개발자는 .md만 편집하면 되고,
 * 게시는 git push → 재배포로 반영된다(노코드 CMS 아님 — 설계 검토에서 명확히 한 부분).
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content');

// 가격 공개 여부는 운영 결정(Open Question #1). price를 비워두면 "문의 시 안내"로 표기.
const ProductFrontmatter = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.enum(['experience', 'fun', 'freediving', 'certification', 'group']),
  durationHours: z.number().optional(),
  priceKRW: z.number().optional(), // 비우면 "문의 시 안내"
  includes: z.array(z.string()).default([]),
  heroImage: z.string().default('/images/placeholder.svg'),
  order: z.number().default(99)
});

export type Product = z.infer<typeof ProductFrontmatter> & {
  body: string;
  /** 요청 로케일에 콘텐츠가 없어 기본 로케일로 폴백했는지 여부 */
  fellBackToDefault: boolean;
};

function readProductFile(locale: Locale, slug: string): { raw: string } | null {
  const file = path.join(CONTENT_ROOT, locale, 'products', `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return { raw: fs.readFileSync(file, 'utf8') };
}

function parse(raw: string, fellBack: boolean): Product {
  const { data, content } = matter(raw);
  const fm = ProductFrontmatter.parse(data);
  return { ...fm, body: content.trim(), fellBackToDefault: fellBack };
}

/**
 * 단일 상품 조회. 요청 로케일에 파일이 없으면 기본 로케일(ko)로 폴백하고
 * fellBackToDefault=true 를 표시한다(페이지에서 noindex 처리에 사용).
 */
export function getProduct(locale: Locale, slug: string): Product | null {
  const direct = readProductFile(locale, slug);
  if (direct) return parse(direct.raw, false);

  if (locale !== routing.defaultLocale) {
    const fallback = readProductFile(routing.defaultLocale, slug);
    if (fallback) return parse(fallback.raw, true);
  }
  return null;
}

/** 특정 카테고리들에 속한 상품만. (다이빙=experience·fun·group, PADI=certification 분리용) */
export function getProductsByCategories(
  locale: Locale,
  categories: Product['category'][]
): Product[] {
  return getAllProducts(locale).filter((p) => categories.includes(p.category));
}

/** 상품 목록. 기본 로케일에 존재하는 모든 상품을 기준으로, 요청 로케일 폴백 적용. */
export function getAllProducts(locale: Locale): Product[] {
  const baseDir = path.join(CONTENT_ROOT, routing.defaultLocale, 'products');
  if (!fs.existsSync(baseDir)) return [];

  const slugs = fs
    .readdirSync(baseDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));

  return slugs
    .map((slug) => getProduct(locale, slug))
    .filter((p): p is Product => p !== null)
    .sort((a, b) => a.order - b.order);
}

export function getAllProductSlugs(): string[] {
  const baseDir = path.join(CONTENT_ROOT, routing.defaultLocale, 'products');
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

/** 가격 표기 헬퍼 — 가격이 없으면 "문의 시 안내"(번역 키로 처리하도록 null 반환). */
export function formatPriceKRW(priceKRW?: number): string | null {
  if (priceKRW == null) return null;
  return new Intl.NumberFormat('ko-KR').format(priceKRW);
}

// ── 강사 소개 (신뢰 앵커 콘텐츠) ─────────────────────────────────────

const InstructorFrontmatter = z.object({
  name: z.string(),
  headline: z.string(),
  certifications: z.array(z.string()).default([]),
  yearsExperience: z.number().optional(),
  photo: z.string().default('/images/placeholder.svg')
});

export type Instructor = z.infer<typeof InstructorFrontmatter> & {
  body: string;
  fellBackToDefault: boolean;
};

export function getInstructor(locale: Locale): Instructor | null {
  const read = (l: Locale) => {
    const file = path.join(CONTENT_ROOT, l, 'instructor.md');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };

  let raw = read(locale);
  let fellBack = false;
  if (!raw && locale !== routing.defaultLocale) {
    raw = read(routing.defaultLocale);
    fellBack = true;
  }
  if (!raw) return null;

  const { data, content } = matter(raw);
  const fm = InstructorFrontmatter.parse(data);
  return { ...fm, body: content.trim(), fellBackToDefault: fellBack };
}

// ── 후기 ─────────────────────────────────────────────────────────────

const ReviewSchema = z.object({
  author: z.string(),
  product: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  text: z.string()
});

export type Review = z.infer<typeof ReviewSchema>;

export function getReviews(locale: Locale): Review[] {
  const read = (l: Locale) => {
    const file = path.join(CONTENT_ROOT, l, 'reviews.json');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };

  const raw = read(locale) ?? read(routing.defaultLocale);
  if (!raw) return [];

  try {
    const parsed = z.array(ReviewSchema).parse(JSON.parse(raw));
    return parsed;
  } catch {
    return [];
  }
}

// ── 갤러리 (사진) ─────────────────────────────────────────────────────
// content/gallery.json (로케일 공유). 사진은 public/ 경로.

const GalleryItemSchema = z.object({
  image: z.string(),
  caption: z.string().optional()
});
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export function getGallery(): GalleryItem[] {
  const file = path.join(CONTENT_ROOT, 'gallery.json');
  if (!fs.existsSync(file)) return [];
  try {
    return z.array(GalleryItemSchema).parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return [];
  }
}

// ── 일정표 (예약 가능 일정) ───────────────────────────────────────────
// content/schedule.json (로케일 공유). status로 상태 표시.

const ScheduleItemSchema = z.object({
  date: z.string(), // 시작일(ISO YYYY-MM-DD) 또는 표시용 문자열
  endDate: z.string().optional(), // 종료일(기간 지정 시). 없으면 단일 날짜.
  program: z.string(),
  // available 예약가능 · full 예약많음 · closed 휴무 · booked 확정예약(시스템 자동, 공개 표시)
  status: z.enum(['available', 'full', 'closed', 'booked']).default('available')
});
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

/**
 * 확정(confirmed)된 예약을 공개 일정표 항목으로 변환한다(고객 정보 제외).
 * 예약 건마다 한 줄씩 '예약됨'으로 노출하고, 세부 프로그램은 빼고 투어 종류(대분류)만 표시.
 * (2건이면 2줄, 3건이면 3줄 — 집계하지 않음.)
 */
export function confirmedBookingsToSchedule(
  bookings: { date?: string; product?: string; status: string }[]
): ScheduleItem[] {
  const out: ScheduleItem[] = [];
  for (const b of bookings) {
    if (b.status !== 'confirmed') continue;
    const date =
      typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(b.date) ? b.date.slice(0, 10) : null;
    if (!date) continue;
    const product = (b.product || '예약').trim();
    const category = product.split(' · ')[0].trim() || '예약'; // 대분류만
    out.push({ date, program: category, status: 'booked' });
  }
  return out;
}

export function getSchedule(): ScheduleItem[] {
  const file = path.join(CONTENT_ROOT, 'schedule.json');
  if (!fs.existsSync(file)) return [];
  try {
    const items = z.array(ScheduleItemSchema).parse(JSON.parse(fs.readFileSync(file, 'utf8')));
    return items.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}
