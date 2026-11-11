import { describe, expect, it } from 'vitest';
import { bookingSummaryRows, joinTourLabel, nextSubmitStep, sendsMedicalMarker } from './booking-confirm';

describe('nextSubmitStep — 보내기를 눌렀을 때 다음 단계', () => {
  it('메디컬 체크가 필요한 투어를 처음 보내면 메디컬 체크부터', () => {
    expect(nextSubmitStep(true, false)).toBe('medical');
  });

  it('메디컬 체크를 이미 마쳤으면(수정하러 돌아갔다 다시 보냄) 바로 가예약 확인', () => {
    expect(nextSubmitStep(true, true)).toBe('confirm');
  });

  it('낚시·요트처럼 메디컬 체크가 필요 없으면 바로 가예약 확인', () => {
    expect(nextSubmitStep(false, false)).toBe('confirm');
    expect(nextSubmitStep(false, true)).toBe('confirm');
  });
});

describe('sendsMedicalMarker — 문의 기록에 메디컬 체크 완료 표시를 붙일지', () => {
  it('메디컬 체크가 필요한 투어이고 마쳤을 때만 붙인다', () => {
    expect(sendsMedicalMarker(true, true)).toBe(true);
  });

  it('다이빙에서 체크를 마친 뒤 낚시로 바꿔 보내면 붙이지 않는다', () => {
    expect(sendsMedicalMarker(false, true)).toBe(false);
  });

  it('체크를 안 했으면 붙이지 않는다', () => {
    expect(sendsMedicalMarker(true, false)).toBe(false);
  });
});

describe('bookingSummaryRows — 가예약 확인 팝업의 입력 내용 요약', () => {
  const base = {
    dateLabel: '2026년 11월 20일 목요일',
    tour: ['스노클링', '푸른동굴 스노클링', '프라이빗'],
    time: '09:00',
    people: '2명',
    email: 'guest@example.com',
    contact: '010-1234-5678',
    timeAskLabel: '개별 문의'
  };

  it('날짜·투어·시간대·인원·이메일·연락처 순서로 보여 준다', () => {
    expect(bookingSummaryRows(base)).toEqual([
      { field: 'date', value: '2026년 11월 20일 목요일' },
      { field: 'tour', value: '스노클링 · 푸른동굴 스노클링 · 프라이빗' },
      { field: 'time', value: '09:00' },
      { field: 'people', value: '2명' },
      { field: 'email', value: 'guest@example.com' },
      { field: 'contact', value: '010-1234-5678' }
    ]);
  });

  it('투어 이름의 빈 칸(클래스·옵션 없음)은 건너뛴다', () => {
    const rows = bookingSummaryRows({ ...base, tour: ['요트', '럭셔리 요트', '', undefined] });
    expect(rows.find((r) => r.field === 'tour')?.value).toBe('요트 · 럭셔리 요트');
  });

  it("시간대 '개별 문의'(운영자용 고정값)는 손님 언어 라벨로 바꾼다", () => {
    const rows = bookingSummaryRows({ ...base, time: '개별 문의', timeAskLabel: 'Ask individually' });
    expect(rows.find((r) => r.field === 'time')?.value).toBe('Ask individually');
  });

  it('시간대를 고르지 않았으면 그 줄을 뺀다', () => {
    const rows = bookingSummaryRows({ ...base, time: '' });
    expect(rows.map((r) => r.field)).not.toContain('time');
  });

  it('앞뒤 공백만 있는 값은 비어 있는 것으로 본다', () => {
    const rows = bookingSummaryRows({ ...base, time: '   ', contact: '  ' });
    expect(rows.map((r) => r.field)).toEqual(['date', 'tour', 'people', 'email']);
  });

  it('긴 이메일도 자르지 않고 그대로 보여 준다(줄바꿈은 화면이 처리)', () => {
    const email = 'very.long.name.for.testing.purposes+okinawa-trip-2026@some-company-domain.co.kr';
    const rows = bookingSummaryRows({ ...base, email });
    expect(rows.find((r) => r.field === 'email')?.value).toBe(email);
  });
});

describe('joinTourLabel — 손님 언어 투어 이름(팝업 요약·완료 화면 공용)', () => {
  it('종류 · 프로그램 · 클래스/옵션을 잇는다', () => {
    expect(joinTourLabel(['Snorkeling', 'Blue Cave Snorkeling', 'Private'])).toBe('Snorkeling · Blue Cave Snorkeling · Private');
  });

  it('빈 칸·공백·undefined 는 건너뛴다', () => {
    expect(joinTourLabel(['釣り', ' ', undefined, '4時間体験釣り', ''])).toBe('釣り · 4時間体験釣り');
  });

  it('모두 비어 있으면 빈 문자열', () => {
    expect(joinTourLabel(['', undefined])).toBe('');
  });
});
