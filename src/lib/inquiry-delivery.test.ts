import { describe, expect, it } from 'vitest';
import { buildInquiryEmail, inquiryResult } from './inquiry-delivery';

const data = {
  product: '스노클링 · 푸른동굴 스노클링 · 프라이빗 투어',
  date: '2026-11-03',
  people: 2,
  name: '홍길동',
  contact: 'kakao: hong',
  email: 'hong@example.com',
  message: '<b>오전</b> 희망'
};

describe('inquiryResult — 저장·메일 결과로 고객 응답 결정', () => {
  it('저장 성공이면 메일 결과와 관계없이 접수 성공(기존 정책)', () => {
    expect(inquiryResult(true, 'sent')).toEqual({ status: 200, body: { ok: true } });
    expect(inquiryResult(true, 'skipped')).toEqual({ status: 200, body: { ok: true } });
    expect(inquiryResult(true, 'failed')).toEqual({
      status: 200,
      body: { ok: true, delivery: 'stored_email_failed' }
    });
  });

  it('저장 실패여도 메일이 실제로 발송됐으면 접수 성공 — 운영자가 메일로 받았다', () => {
    expect(inquiryResult(false, 'sent')).toEqual({ status: 200, body: { ok: true, delivery: 'email_only' } });
  });

  it('저장도 메일도 안 됐으면 실패 — 아무도 못 받은 문의를 성공이라 하지 않는다', () => {
    expect(inquiryResult(false, 'failed')).toEqual({ status: 500, body: { error: 'store_failed' } });
    // 메일 키 미설정(콘솔 기록만)은 발송이 아니다
    expect(inquiryResult(false, 'skipped')).toEqual({ status: 500, body: { error: 'store_failed' } });
  });
});

describe('buildInquiryEmail — 알림 메일', () => {
  it('저장된 문의는 기존 제목·어드민 링크', () => {
    const n = buildInquiryEmail(data, { stored: true });
    expect(n.subject).toBe('[OKINITY] 새 예약 문의 — 홍길동 · 스노클링 · 푸른동굴 스노클링 · 프라이빗 투어');
    expect(n.text).toContain('성함: 홍길동');
    expect(n.text).not.toContain('저장되지 않았');
    expect(n.replyTo).toBe('hong@example.com');
  });

  it('저장 실패 문의는 제목·본문에 경고 — 어드민 목록에 없으니 메일로 처리해야 한다', () => {
    const n = buildInquiryEmail(data, { stored: false });
    expect(n.subject.startsWith('[저장 실패·메일로 처리]')).toBe(true);
    expect(n.text).toContain('어드민 예약 목록에 저장되지 않았습니다');
    expect(n.html).toContain('어드민 예약 목록에 저장되지 않았습니다');
    // 문의 내용은 그대로 전달
    expect(n.text).toContain('연락처: kakao: hong');
  });

  it('고객 입력은 HTML 이스케이프', () => {
    const n = buildInquiryEmail(data, { stored: false });
    expect(n.html).toContain('&lt;b&gt;오전&lt;/b&gt;');
    expect(n.html).not.toContain('<b>오전</b>');
  });

  it('이메일이 없으면 연락처가 이메일 형식일 때만 회신 주소로', () => {
    expect(buildInquiryEmail({ ...data, email: '', contact: 'a@b.co' }, { stored: true }).replyTo).toBe('a@b.co');
    expect(buildInquiryEmail({ ...data, email: '' }, { stored: true }).replyTo).toBeUndefined();
  });
});
