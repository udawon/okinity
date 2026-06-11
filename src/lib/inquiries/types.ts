import { z } from 'zod';

// 가예약(고객 신청·미확정) → 확정 → 완료 / 취소
export const INQUIRY_STATUSES = ['tentative', 'confirmed', 'done', 'canceled'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/**
 * 메디컬 체크 완료 표식 — 예약 폼이 메시지(요청사항) 앞에 붙이고, 어드민은 이를 떼어내 별도로 표시한다.
 * (DB 컬럼 추가 없이 메디컬 완료 여부를 보관·복원하기 위한 약속된 접두사)
 */
export const MEDICAL_MARKER = '[메디컬 체크 완료 · 전 항목 확인]';

/** 저장된 메시지에서 메디컬 표식을 분리 → { 메디컬 완료 여부, 순수 요청사항 }. */
export function splitMedical(message?: string): { medicalChecked: boolean; request: string } {
  const m = (message ?? '').trim();
  if (m.startsWith(MEDICAL_MARKER)) {
    return { medicalChecked: true, request: m.slice(MEDICAL_MARKER.length).trim() };
  }
  return { medicalChecked: false, request: m };
}

/** 폼에서 받는 입력 (검증용). API 라우트와 store가 공유. */
export const NewInquirySchema = z.object({
  product: z.string().max(100).optional(),
  date: z.string().max(40).optional(),
  /** 희망 시간대(오전·오후·종일 등). 방문자 입력. */
  time: z.string().max(40).optional(),
  people: z.coerce.number().int().min(1).max(50).optional(),
  name: z.string().min(1).max(100),
  /** 이메일 — 확정/변경/취소 안내 수신용. 고객 예약 폼에서는 필수(required)로 강제.
   *  스키마는 레거시(이메일 없는 기존 문의)의 어드민 수정·이동을 깨지 않도록 빈 값/미입력 허용. */
  email: z.string().email().max(200).optional().or(z.literal('')),
  /** 전화·카카오톡·라인 등 즉시 연락 수단. */
  contact: z.string().min(1).max(200),
  message: z.string().max(2000).optional()
});
export type NewInquiry = z.infer<typeof NewInquirySchema>;

export interface Inquiry extends NewInquiry {
  id: string;
  createdAt: string; // ISO
  status: InquiryStatus;
  /** 운영자 내부 메모(통화 결과·특이사항). 고객에게 노출되지 않음. */
  note?: string;
  /** 운영자가 배정한 실제 시각(HH:MM). 방문자 희망 time과 별개. 운영 보드 타임라인 배치용. */
  scheduledTime?: string;
}

/** 저장소 어댑터 인터페이스. JSON/Postgres가 동일 계약을 구현한다. */
export interface InquiryStore {
  create(input: NewInquiry): Promise<Inquiry>;
  list(): Promise<Inquiry[]>;
  updateStatus(id: string, status: InquiryStatus): Promise<boolean>;
  updateNote(id: string, note: string): Promise<boolean>;
  /** 운영자 배정 시각(HH:MM) 설정. 빈 값이면 미배정으로 되돌림. */
  updateScheduledTime(id: string, time: string): Promise<boolean>;
  /** 예약 내용 수정(투어·날짜·시간·인원·이름·연락처·메시지). 상태·메모·접수시각은 유지. */
  update(id: string, input: NewInquiry): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
