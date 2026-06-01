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
  product: (slug: string) => `product:${slug}`
} as const;

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
 * 미디어(이미지·동영상) 업로드 → 공개 URL 반환. 어드민 서버액션 전용.
 * pathPrefix 예) 'hero', 'products', 'gallery'
 */
export async function uploadMedia(file: File, pathPrefix: string): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다.');
  const safeExt = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const objectPath = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error } = await sb.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(`업로드 실패: ${error.message}`);
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath).data.publicUrl;
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
