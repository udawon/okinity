import { z } from 'zod';

/**
 * 예약 정산 정보 — 확정일자 + 정산금액(엔/원). DB 컬럼 추가 없이 site_content `inquiry_settlement`
 * 단일 키(JSONB)에 { items: { [inquiryId]: InquirySettlement } } 로 저장한다. (예전 tour_prices와 동일 패턴)
 *
 * 확정일자는 고객 희망일(inquiry.date)과 별개로 운영자가 지정 — 월별/수익 집계의 기준일.
 * 금액은 ₩/¥ 둘 다 보관(입력 시점 환율로 자동 변환된 스냅샷) → 환율 변동과 무관하게 과거 수익이 고정.
 */

export const InquirySettlementSchema = z.object({
  /** 확정일자 (YYYY-MM-DD). 비우면 미확정. */
  confirmedDate: z.string().default(''),
  /** 정산금액(엔). 정수. */
  amountJPY: z.number().nonnegative().optional(),
  /** 정산금액(원). 정수. */
  amountKRW: z.number().nonnegative().optional()
});
export type InquirySettlement = z.infer<typeof InquirySettlementSchema>;

export type SettlementMap = Record<string, InquirySettlement>;

const StoreSchema = z.object({
  items: z.record(z.string(), InquirySettlementSchema).default({})
});

/** site_content 값 → { [id]: InquirySettlement }. 실패 시 빈 맵. */
export function parseSettlementMap(raw: unknown): SettlementMap {
  const parsed = StoreSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data.items : {};
}

export function emptySettlement(): InquirySettlement {
  return { confirmedDate: '', amountJPY: undefined, amountKRW: undefined };
}

/** 월별/수익 집계의 기준일 — 확정일이 있으면 확정일, 없으면 고객 희망일. (YYYY-MM-DD 또는 빈 문자열) */
export function effectiveDate(confirmedDate: string | undefined, desiredDate: string | undefined): string {
  const c = (confirmedDate ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(c)) return c.slice(0, 10);
  const d = (desiredDate ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return '';
}

/** YYYY-MM-DD → 'YYYY-MM'(월 키). 파싱 불가 시 빈 문자열(=날짜 미정). */
export function monthKey(dateKey: string): string {
  return /^\d{4}-\d{2}/.test(dateKey) ? dateKey.slice(0, 7) : '';
}
