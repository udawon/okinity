import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { parseTourTimes } from '@/lib/tour-times';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import TourTimesForm from '@/components/admin/TourTimesForm';

export const dynamic = 'force-dynamic';

export default async function AdminTourTimesPage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.tourTimes) : null;
  const defaults = parseTourTimes(value);

  return (
    <AdminShell title="투어 시간대">
      <p className="mb-4 text-sm text-muted">
        투어별로 예약 폼에서 선택할 수 있는 시간대를 등록합니다. 쉼표(,)로 구분해 여러 개를
        입력할 수 있습니다.
      </p>
      <TourTimesForm defaults={defaults} disabled={!enabled} />
    </AdminShell>
  );
}
