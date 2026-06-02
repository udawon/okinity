import { z } from 'zod';

export const INQUIRY_STATUSES = ['new', 'confirmed', 'done', 'canceled'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/** 폼에서 받는 입력 (검증용). API 라우트와 store가 공유. */
export const NewInquirySchema = z.object({
  product: z.string().max(100).optional(),
  date: z.string().max(40).optional(),
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
}

/** 저장소 어댑터 인터페이스. JSON/Postgres가 동일 계약을 구현한다. */
export interface InquiryStore {
  create(input: NewInquiry): Promise<Inquiry>;
  list(): Promise<Inquiry[]>;
  updateStatus(id: string, status: InquiryStatus): Promise<boolean>;
  updateNote(id: string, note: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
