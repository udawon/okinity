import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 서버 클라이언트 (service_role) — DB 읽기/쓰기 + Storage 업로드.
 *
 * 서버 전용(server-only). service_role 키는 RLS를 우회하므로 절대 클라이언트로 노출 금지.
 * 환경변수가 없으면 null 을 반환한다 → 호출부는 md/json 기본값으로 graceful fallback.
 * (키 미설정 로컬/CI 에서도 빌드·메인 페이지가 정상 동작하도록.)
 */
let cached: SupabaseClient | null | undefined;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cached;
}

/** Supabase 연동 활성 여부 (어드민 UI 가드용). */
export function isSupabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media';
