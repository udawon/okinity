import { z } from 'zod';

// 가예약(고객 신청·미확정) → 확정 → 완료 / 취소
export const INQUIRY_STATUSES = ['tentative', 'confirmed', 'done', 'canceled'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/** 폼에서 받는 입력 (검증용). API 라우트와 store가 공유. */
export const NewInquirySchema = z.object({
  product: z.string().max(100).optional(),
  date: z.string().max(40).optional(),
  /** 희망 시간대(오전·오후·종일 등). 방문자 입력. */
  time: z.string().max(40).optional(),
  people: z.coerce.number().int().min(1).max(50).optional(),
  name: z.string().min(1).max(100),
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
