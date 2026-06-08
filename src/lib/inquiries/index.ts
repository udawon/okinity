import type { InquiryStore } from './types';
import { jsonStore } from './json-store';

/**
 * 환경에 따라 저장소 어댑터를 선택한다(우선순위 순).
 * 1) Supabase 설정됨 → Supabase (콘텐츠와 동일 DB로 통합, 영속) ← 기본
 * 2) POSTGRES_URL 있음 → Vercel Postgres (구버전 호환, 영속)
 * 3) 둘 다 없음 → JSON 파일 (로컬 전용, 휘발성 주의)
 *
 * 각 어댑터는 동적 import 해 불필요한 드라이버를 로드하지 않는다.
 */
let cached: InquiryStore | null = null;

export async function getInquiryStore(): Promise<InquiryStore> {
  if (cached) return cached;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { supabaseStore } = await import('./supabase-store');
    cached = supabaseStore;
  } else if (process.env.POSTGRES_URL) {
    const { postgresStore } = await import('./postgres-store');
    cached = postgresStore;
  } else if (process.env.NODE_ENV === 'production') {
    // 운영에서 JSON 파일 저장소는 읽기 전용 파일시스템(EROFS)으로 쓰기가 실패하고,
    // 설령 가능해도 서버리스 인스턴스마다 휘발된다. 무증상 데이터 유실 대신 즉시 실패시킨다.
    throw new Error(
      '운영 환경에는 영속 저장소가 필요합니다 — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 또는 POSTGRES_URL을 설정하세요.'
    );
  } else {
    cached = jsonStore;
  }
  return cached;
}

export type { Inquiry, InquiryStatus, NewInquiry } from './types';
export { INQUIRY_STATUSES, NewInquirySchema } from './types';
