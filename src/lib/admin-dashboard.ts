/**
 * 어드민 "오늘" 대시보드 계산 — 순수 함수(서버 페이지가 데이터를 모아 넘긴다).
 * 확정 대기 문의 · 다가오는 7일 · 사이트 점검.
 */
import type { Inquiry } from './inquiries/types';
import { effectiveDate, type SettlementMap } from './inquiry-settlement';
import type { TourDetail } from './tour';
import { isRuleSection, parseTourBody } from './tour-body';

/** YYYY-MM-DD + n일 (UTC 기준 날짜 산술 — 시간대 영향 없음). */
export function addDays(dateKey: string, n: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 확정이 필요한 문의(가예약) — 최근 접수순. */
export function pendingInquiries(inquiries: Inquiry[]): Inquiry[] {
  return inquiries
    .filter((q) => q.status === 'tentative')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type UpcomingItem = { inquiry: Inquiry; date: string; time: string };

/**
 * 오늘부터 days 일 안의 예약(확정·가예약). 날짜는 정산 확정일 우선(운영 보드와 같은 규칙),
 * 시간은 운영자 배정 시각 우선. 날짜·시간순.
 */
export function upcomingInquiries(
  inquiries: Inquiry[],
  settlements: SettlementMap,
  today: string,
  days = 7
): UpcomingItem[] {
  const end = addDays(today, days - 1);
  return inquiries
    .filter((q) => q.status === 'confirmed' || q.status === 'tentative')
    .map((q) => ({
      inquiry: q,
      date: effectiveDate(settlements[q.id]?.confirmedDate, q.date),
      time: (q.scheduledTime || q.time || '').trim()
    }))
    .filter((x) => x.date && x.date >= today && x.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export type SiteCheckTour = {
  slug: string;
  name: string;
  /** 한국어 상세(코드 기본값 폴백 적용 후) */
  ko: TourDetail;
  hasEn: boolean;
  hasJa: boolean;
  /** 투어 시간대 */
  times: string[];
};

export type SiteCheck = {
  id: 'empty' | 'refund' | 'times' | 'translation' | 'photos' | 'blog';
  tone: 'warn' | 'info' | 'ok';
  title: string;
  detail: string;
  items: string[];
  href: string;
};

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 사이트 점검 — 손님이 보는 페이지에서 빠진 것. 문제가 없으면 그 항목은 만들지 않는다. */
export function siteChecks(input: { tours: SiteCheckTour[]; lastBlogDate: string | null; today: string }): SiteCheck[] {
  const { tours, lastBlogDate, today } = input;
  const out: SiteCheck[] = [];
  const live = tours.filter((t) => t.ko.published && t.ko.body.trim());

  const empty = tours.filter((t) => !t.ko.published || !t.ko.body.trim()).map((t) => t.name);
  if (empty.length)
    out.push({
      id: 'empty',
      tone: 'warn',
      title: `상세가 비었거나 비공개인 투어 ${empty.length}개`,
      detail: '손님에게 “준비 중” 안내만 보여요.',
      items: empty,
      href: '/admin/tours'
    });

  const noRefund = live
    .filter(
      (t) =>
        !t.ko.notices.includes('refund') &&
        !parseTourBody(t.ko.body).sections.some((s) => isRuleSection(s.title) && /환불|취소/.test(s.title))
    )
    .map((t) => t.name);
  if (noRefund.length)
    out.push({
      id: 'refund',
      tone: 'warn',
      title: `환불 규정이 없는 투어 ${noRefund.length}개`,
      detail: '본문에 환불 규정이 없고 공통 안내도 꺼져 있어요.',
      items: noRefund,
      href: '/admin/tour-notices'
    });

  const noTimes = live.filter((t) => !t.times.length && !t.ko.startNote.trim()).map((t) => t.name);
  if (noTimes.length)
    out.push({
      id: 'times',
      tone: 'info',
      title: `출발 시간이 없는 투어 ${noTimes.length}개`,
      detail: '예약 달력에서 “개별 문의”로 보여요. 투어 시간대나 출발 안내를 입력하세요.',
      items: noTimes,
      href: '/admin/tour-times'
    });

  const noTranslation = live.filter((t) => !t.hasEn || !t.hasJa).map((t) => t.name);
  if (noTranslation.length)
    out.push({
      id: 'translation',
      tone: 'info',
      title: `English · 日本語 상세가 없는 투어 ${noTranslation.length}개`,
      detail: '해당 언어 페이지에 한국어가 그대로 보여요.',
      items: noTranslation,
      href: '/admin/tours'
    });

  const fewPhotos = live
    .filter((t) => (t.ko.images.length || (t.ko.heroImage ? 1 : 0)) <= 1)
    .map((t) => t.name);
  if (fewPhotos.length)
    out.push({
      id: 'photos',
      tone: 'info',
      title: `사진이 1장뿐인 투어 ${fewPhotos.length}개`,
      detail: '3장 이상이면 PC에서 사진 모자이크로 보여요.',
      items: fewPhotos,
      href: '/admin/tours'
    });

  if (lastBlogDate) {
    const ago = daysBetween(lastBlogDate, today);
    out.push({
      id: 'blog',
      tone: ago > 14 ? 'warn' : 'ok',
      title: `최근 투어 기록 ${ago <= 0 ? '오늘' : `${ago}일 전`}`,
      detail: ago > 14 ? '2주 넘게 새 기록이 없어요.' : '꾸준히 올라오고 있어요.',
      items: [],
      href: '/admin/blog'
    });
  }
  return out;
}
