import type { InquiryStore } from './types';
import { jsonStore } from './json-store';

/**
 * 환경에 따라 저장소 어댑터를 선택한다.
 * - POSTGRES_URL 있으면 → Postgres (영속, 프로덕션)
 * - 없으면 → JSON 파일 (로컬/단일서버, 휘발성 주의)
 *
 * Postgres 어댑터는 동적 import 해 JSON-only 환경에서 @vercel/postgres를 로드하지 않는다.
 */
let cached: InquiryStore | null = null;

export async function getInquiryStore(): Promise<InquiryStore> {
  if (cached) return cached;

  if (process.env.POSTGRES_URL) {
    const { postgresStore } = await import('./postgres-store');
    cached = postgresStore;
  } else {
    cached = jsonStore;
  }
  return cached;
}

export type { Inquiry, InquiryStatus, NewInquiry } from './types';
export { INQUIRY_STATUSES, NewInquirySchema } from './types';
