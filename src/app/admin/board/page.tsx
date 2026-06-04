import { getInquiryStore } from '@/lib/inquiries';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { getSchedule, type ScheduleItem } from '@/lib/content';
import { parseTourPrices } from '@/lib/tour-pricing';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import MonthBoard from '@/components/admin/MonthBoard';

export const dynamic = 'force-dynamic';

export default async function AdminBoardPage() {
  const enabled = isSupabaseEnabled();
  const store = await getInquiryStore();
  const inquiries = await store.list();
  const prices = enabled ? parseTourPrices(await getSiteContent(CONTENT_KEYS.tourPrices)) : {};

  // 휴무일(공개 일정표와 동일 출처) — 보드에도 표시
  const schedVal = enabled ? await getSiteContent(CONTENT_KEYS.schedule) : null;
  const schedItems = (
    Array.isArray((schedVal as { items?: unknown } | null)?.items)
      ? ((schedVal as { items: ScheduleItem[] }).items)
      : getSchedule()
  ) as ScheduleItem[];
  const closedDates = schedItems
    .filter((s) => s.status === 'closed' && /^\d{4}-\d{2}-\d{2}/.test(s.date))
    .map((s) => s.date.slice(0, 10));

  // 오늘(오키나와 JST) 기준 — 서버/클라 동일 문자열 보장
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return (
    <AdminShell title="운영 보드">
      <p className="mb-4 text-sm text-muted">
        월 단위 달력으로 예약을 봅니다. <strong>날짜를 누르면 하루 상세</strong>(시간 배치·드래그·수정)로
        들어갑니다. 카드를 다른 날짜로 끌어 옮길 수도 있어요. 예상매출은 단가×인원으로{' '}
        <strong>고객에게 보이지 않습니다.</strong>
      </p>
      <MonthBoard inquiries={inquiries} prices={prices} todayKey={todayKey} closedDates={closedDates} />
    </AdminShell>
  );
}
