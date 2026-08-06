import 'server-only';
import { getSupabaseAdmin, MEDIA_BUCKET } from './supabase/server';

/**
 * 콘텐츠 오버라이드 레이어 — content/*.md(기본값) 위에 어드민 편집분을 덮어쓴다.
 *
 * site_content 테이블(key-value JSONB)에서 읽고, 메인 페이지는 md + 오버라이드를 머지.
 * Supabase 미설정 시 모든 읽기는 빈 값 → 메인은 md 기본값만 사용(정상 동작).
 */

export type Json = Record<string, unknown>;

/** 영역별 콘텐츠 키. */
export const CONTENT_KEYS = {
  hero: 'hero',
  gallery: 'gallery',
  schedule: 'schedule',
  blog: 'blog',
  /** 공지사항. value: { items: NoticePost[] } */
  notice: 'notice',
  /** 홈 투어 카테고리 카드 이미지(다이빙·PADI·낚시·스노클링). value: { images: { [id]: url } } */
  homeTours: 'home_tours',
  /** 하위 투어 상세 콘텐츠. value: TourDetail. 목록은 코드 카탈로그(lib/tour) 고정. */
  tour: (slug: string) => `tour:${slug}`,
  /** 낚시 공통 클래스(미들/럭셔리). value: TourClasses. 4개 낚시 투어 상세에 공통 적용(동기화). */
  fishingClasses: 'fishing_classes',
  /** 예약 정산(확정일+금액 ₩/¥). value: { items: { [id]: InquirySettlement } }. 어드민 전용, DB 컬럼 대체. */
  inquirySettlement: 'inquiry_settlement',
  /** 소개(About) 페이지 콘텐츠. value: AboutContent(lib/about). */
  about: 'about',
  /** 투어별 기준 단가(운영 보드 예상매출용, 고객 비노출). value: { prices: { [slug]: number } } */
  tourPrices: 'tour_prices',
  product: (slug: string) => `product:${slug}`
} as const;

// ── 콘텐츠 다국어 ─────────────────────────────────────────────────────
// ko(기본)는 무접미사 키, en/ja는 `${key}:${locale}` 키에 저장한다.
// 조회는 로케일 키 우선 → 없으면 기본(ko) 키로 폴백 — 미번역 콘텐츠는 한국어가 보인다.

export const CONTENT_LOCALES = ['ko', 'en', 'ja'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export function isContentLocale(v: unknown): v is ContentLocale {
  return typeof v === 'string' && (CONTENT_LOCALES as readonly string[]).includes(v);
}

/** 로케일별 저장 키. ko는 기존 키 그대로(하위 호환). */
export function localizedContentKey(key: string, locale: string): string {
  return locale === 'ko' ? key : `${key}:${locale}`;
}

/** 로케일 우선 조회 — `${key}:${locale}` 값이 있으면 그것을, 없으면 기본(ko) 키 값으로 폴백. */
export async function getLocalizedSiteContent(key: string, locale: string): Promise<Json | null> {
  if (locale === 'ko') return getSiteContent(key);
  const localized = localizedContentKey(key, locale);
  const map = await getSiteContentMap([key, localized]);
  return (map[localized] ?? map[key] ?? null) as Json | null;
}

/** 여러 키를 한 번에 조회(메인 페이지용). 키 생략 시 전체. */
export async function getSiteContentMap(keys?: string[]): Promise<Record<string, Json>> {
  const sb = getSupabaseAdmin();
  if (!sb) return {};
  let query = sb.from('site_content').select('key, value');
  if (keys && keys.length) query = query.in('key', keys);
  const { data, error } = await query;
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.key as string, (r.value as Json) ?? {}]));
}

/** 단일 키 조회. 없으면 null. */
export async function getSiteContent(key: string): Promise<Json | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from('site_content')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return null;
  return (data.value as Json) ?? null;
}

/** 단일 키 저장(upsert). 어드민 서버액션 전용. Supabase 미설정 시 에러. */
export async function setSiteContent(key: string, value: Json): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다. (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  const { error } = await sb.from('site_content').upsert({ key, value });
  if (error) throw new Error(`콘텐츠 저장 실패: ${error.message}`);
}

/**
 * 미디어(이미지·동영상) 업로드용 서명 URL 발급 → 브라우저가 Supabase로 직접 PUT 한다.
 * 어드민 서버액션 전용. pathPrefix 예) 'hero', 'blog', 'notice'
 *
 * 파일 본문을 서버액션으로 받지 않는 이유: Vercel 서버리스 함수의 요청 본문 한도(4.5MB)에
 * 걸려 영상은 사실상 업로드가 불가능하다(next.config 의 bodySizeLimit 을 올려도 플랫폼 한도가
 * 우선). 서명 URL은 토큰이 쿼리에 실려 있어 브라우저에 API 키를 노출하지 않는다.
 *
 * 파일명은 매 업로드 고유(타임스탬프-랜덤)라 내용이 불변 — /cdn 프록시가 1년 immutable 캐시를
 * 입혀도 안전하다(교체 시 새 URL이 생긴다).
 */
export async function createSignedUpload(
  filename: string,
  pathPrefix: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다.');
  const safeExt = (filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safePrefix = pathPrefix.replace(/[^a-z0-9/_-]/gi, '') || 'misc';
  const objectPath = `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { data, error } = await sb.storage.from(MEDIA_BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) throw new Error(`업로드 URL 발급 실패: ${error?.message ?? '알 수 없는 오류'}`);
  return {
    uploadUrl: data.signedUrl,
    publicUrl: sb.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath).data.publicUrl
  };
}

/** value에서 비어있지 않은 필드만 추려 base 위에 머지(빈 문자열/undefined는 무시). */
export function mergeOverride<T extends Json>(base: T, override: Json | null | undefined): T {
  if (!override) return base;
  const out: Json = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }
  return out as T;
}
