import { getInquiryStore } from '@/lib/inquiries';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseTourPrices } from '@/lib/tour-pricing';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import WeekBoard from '@/components/admin/WeekBoard';

export const dynamic = 'force-dynamic';

export default async function AdminBoardPage() {
  const store = await getInquiryStore();
  const inquiries = await store.list();
  const prices = isSupabaseEnabled()
    ? parseTourPrices(await getSiteContent(CONTENT_KEYS.tourPrices))
    : {};

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
        예약을 주간 타임라인으로 봅니다. 카드의 상태를 바로 바꿀 수 있어요. 예상매출은 투어별 단가 ×
        인원(취소·완료 제외)이며 <strong>고객에게 보이지 않습니다.</strong>
      </p>
      <WeekBoard inquiries={inquiries} prices={prices} todayKey={todayKey} />
    </AdminShell>
  );
}
