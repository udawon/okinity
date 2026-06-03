import { getSchedule, type ScheduleItem } from '@/lib/content';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import ScheduleForm from '@/components/admin/ScheduleForm';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulePage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.schedule) : null;
  const overrideItems = (value as { items?: unknown } | null)?.items;
  const defaults: ScheduleItem[] = Array.isArray(overrideItems)
    ? (overrideItems as ScheduleItem[])
    : getSchedule();

  return (
    <AdminShell title="일정·휴무">
      <p className="mb-4 text-sm text-muted">
        <strong>휴무일</strong>·예약가능·예약많음을 직접 지정합니다. 홈 하단 달력과 <code>/일정표</code>{' '}
        페이지에 반영됩니다. <strong>확정 예약 2건 이상</strong>인 날은 자동으로 “예약 많음”으로
        표시됩니다(여기서 지정 불필요).
      </p>
      <ScheduleForm defaults={defaults} disabled={!enabled} />
    </AdminShell>
  );
}
