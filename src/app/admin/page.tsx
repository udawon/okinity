import { getInquiryStore } from '@/lib/inquiries';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseSettlementMap } from '@/lib/inquiry-settlement';
import { getJpyKrwRate } from '@/lib/exchange-rate';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import ReservationManager from '@/components/admin/ReservationManager';

// 항상 최신 데이터를 보여줘야 하므로 동적 렌더링.
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const store = await getInquiryStore();
  const inquiries = await store.list();
  const enabled = isSupabaseEnabled();
  const settlements = enabled
    ? parseSettlementMap(await getSiteContent(CONTENT_KEYS.inquirySettlement))
    : {};
  const rate = await getJpyKrwRate();

  // 오늘(오키나와 JST) — 월 네비게이터 기본 월. 서버에서 계산해 서버/클라 일치 보장.
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return (
    <AdminShell title="예약 관리">
      <ReservationManager
        inquiries={inquiries}
        settlements={settlements}
        rate={rate}
        todayKey={todayKey}
      />
    </AdminShell>
  );
}
