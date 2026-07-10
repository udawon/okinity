import { getSchedule, type ScheduleItem } from '@/lib/content';
import { normalizeScheduleItems } from '@/lib/schedule-range';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import ScheduleForm from '@/components/admin/ScheduleForm';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulePage() {
  const enabled = isSupabaseEnabled();
  const value = enabled ? await getSiteContent(CONTENT_KEYS.schedule) : null;
  const overrideItems = (value as { items?: unknown } | null)?.items;
  // 과거 저장분(휴무/오전만/오후만 상태 체계)도 현재 구분으로 자동 변환해 보여준다.
  const defaults: ScheduleItem[] = Array.isArray(overrideItems)
    ? normalizeScheduleItems(overrideItems)
    : getSchedule();

  return (
    <AdminShell title="일정·휴무">
      <p className="mb-4 text-sm text-muted">
        달력에 표시할 일정을 등록합니다. <strong>입력한 내용이 그대로</strong> 홈·예약 달력에
        표시되고, 구분에 따라 색으로 구분됩니다 — <strong>투어·프로그램</strong>(파랑),{' '}
        <strong>특별 일정</strong>(노랑), <strong>예약 불가</strong>(빨강 — 휴무·출장 등, 해당 날짜는
        예약 선택이 막힙니다). <strong>시작일~종료일</strong>로 기간 지정 가능(단일 날짜는 종료일
        비움)하며, 기간 일정은 이어진 막대로 표시됩니다.
      </p>
      <ScheduleForm defaults={defaults} disabled={!enabled} />
    </AdminShell>
  );
}
