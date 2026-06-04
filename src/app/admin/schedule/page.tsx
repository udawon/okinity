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
        <strong>휴무일</strong> 등을 지정합니다. <strong>시작일~종료일</strong>로 기간 지정 가능(단일
        날짜는 종료일 비움). 예약 페이지 달력에 반영되며, 기간 휴무는 <strong>이어진 형태</strong>로
        표시됩니다. 확정 예약 2건 이상인 날은 자동으로 “예약 많음”으로 표시됩니다.
      </p>
      <ScheduleForm defaults={defaults} disabled={!enabled} />
    </AdminShell>
  );
}
