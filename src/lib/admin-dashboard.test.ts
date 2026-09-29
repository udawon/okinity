import { describe, expect, it } from 'vitest';
import type { Inquiry } from './inquiries/types';
import { addDays, pendingInquiries, siteChecks, upcomingInquiries } from './admin-dashboard';
import { emptyTourDetail, type TourDetail } from './tour';

const inq = (patch: Partial<Inquiry>): Inquiry => ({
  id: patch.id ?? Math.random().toString(36).slice(2),
  createdAt: '2026-09-27T00:00:00.000Z',
  status: 'tentative',
  name: '홍길동',
  contact: '010',
  ...patch
});

describe('addDays', () => {
  it('YYYY-MM-DD 에 날짜를 더한다(월·연 넘김 포함)', () => {
    expect(addDays('2026-09-28', 6)).toBe('2026-10-04');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});

describe('pendingInquiries', () => {
  it('가예약만 최근 접수순', () => {
    const r = pendingInquiries([
      inq({ id: 'a', createdAt: '2026-09-20T00:00:00Z' }),
      inq({ id: 'b', status: 'confirmed' }),
      inq({ id: 'c', createdAt: '2026-09-26T00:00:00Z' })
    ]);
    expect(r.map((q) => q.id)).toEqual(['c', 'a']);
  });
});

describe('upcomingInquiries', () => {
  const today = '2026-09-28';
  it('오늘부터 7일 안의 확정·가예약을 날짜·시간순, 확정일이 있으면 확정일 기준', () => {
    const r = upcomingInquiries(
      [
        inq({ id: 'past', date: '2026-09-27', status: 'confirmed' }),
        inq({ id: 'late', date: '2026-09-29', time: '14:00', status: 'confirmed' }),
        inq({ id: 'early', date: '2026-09-29', time: '09:00', status: 'tentative' }),
        inq({ id: 'moved', date: '2026-10-20', status: 'confirmed' }),
        inq({ id: 'out', date: '2026-10-05', status: 'confirmed' }),
        inq({ id: 'cancel', date: '2026-09-30', status: 'canceled' }),
        inq({ id: 'nodate', status: 'confirmed' })
      ],
      { moved: { confirmedDate: '2026-10-01', amountKrw: null, amountJpy: null } } as never,
      today
    );
    expect(r.map((x) => x.inquiry.id)).toEqual(['early', 'late', 'moved']);
    expect(r[2].date).toBe('2026-10-01');
  });

  it('배정 시각(scheduledTime)이 희망 시간보다 우선', () => {
    const r = upcomingInquiries(
      [inq({ id: 'x', date: today, time: '오후', scheduledTime: '13:30', status: 'confirmed' })],
      {},
      today
    );
    expect(r[0].time).toBe('13:30');
  });
});

describe('siteChecks', () => {
  const tour = (patch: Partial<TourDetail>): TourDetail => ({ ...emptyTourDetail(), published: true, body: '본문', ...patch });

  it('비어 있는 투어·환불 규정 없는 투어·출발 시간 없는 투어를 알려준다', () => {
    const checks = siteChecks({
      tours: [
        { slug: 'a', name: 'A 투어', ko: tour({ body: '★환불 규정★\n*7일 전 100%' }), translationStale: 0, times: ['09:00'] },
        { slug: 'b', name: 'B 투어', ko: tour({ body: '소개만' }), translationStale: 0, times: [] },
        { slug: 'c', name: 'C 투어', ko: tour({ published: false, body: '' }), translationStale: 12, times: [] },
        { slug: 'd', name: 'D 투어', ko: tour({ body: '소개', notices: ['refund'], startNote: '자유 출발' }), translationStale: 3, times: [] }
      ],
      lastBlogDate: '2026-09-24',
      today: '2026-09-28'
    });
    const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
    expect(byId.empty.items).toEqual(['C 투어']);
    expect(byId.refund.items).toEqual(['B 투어']);
    expect(byId.times.items).toEqual(['B 투어']);
    expect(byId.translation.items).toEqual(['D 투어']);
    expect(byId.blog.title).toContain('4일 전');
  });

  it('문제가 없으면 해당 항목을 만들지 않는다', () => {
    const checks = siteChecks({
      tours: [
        { slug: 'a', name: 'A', ko: tour({ notices: ['refund'], images: ['1', '2', '3'] }), translationStale: 0, times: ['09:00'] }
      ],
      lastBlogDate: null,
      today: '2026-09-28'
    });
    expect(checks.map((c) => c.id)).toEqual([]);
  });
});
