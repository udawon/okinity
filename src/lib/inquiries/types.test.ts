import { describe, expect, it } from 'vitest';
import { NewInquirySchema } from './types';

const base = { name: '홍길동', contact: '010-0000-0000' };

describe('NewInquirySchema — 예약 폼이 보낸 값', () => {
  it('인원 칸을 비우거나 값이 없으면 인원 미정으로 접수한다(접수 실패 금지)', () => {
    expect(NewInquirySchema.parse({ ...base, people: '' }).people).toBeUndefined();
    expect(NewInquirySchema.parse({ ...base, people: null }).people).toBeUndefined();
    expect(NewInquirySchema.parse({ ...base, people: '3' }).people).toBe(3);
  });

  it('범위 밖 인원은 거절한다', () => {
    expect(NewInquirySchema.safeParse({ ...base, people: '0' }).success).toBe(false);
    expect(NewInquirySchema.safeParse({ ...base, people: 51 }).success).toBe(false);
  });

  it('선택 칸이 없어 null 로 온 글 값은 비어 있는 것으로 본다', () => {
    const parsed = NewInquirySchema.parse({ ...base, time: null, date: '', product: null, message: null });
    expect(parsed.time).toBeUndefined();
    expect(parsed.date).toBeUndefined();
    expect(parsed.product).toBeUndefined();
    expect(parsed.message).toBeUndefined();
  });
});
