import 'server-only';
import { getSupabaseAdmin } from './supabase/server';
import { addDays } from './admin-dashboard';

/**
 * 방문자 카운터 저장소 — Supabase `site_visits` 테이블(docs/supabase-site-visits.sql).
 * 테이블이 아직 없으면 기록은 조용히 건너뛰고, 통계는 ready=false 로 알려 대시보드가 설정 안내를 띄운다.
 */
const TABLE = 'site_visits';

/** 하루 1명 기록(같은 날 같은 방문자는 무시). 실패해도 사이트 동작에는 영향 없음. */
export async function recordVisit(day: string, visitor: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from(TABLE).upsert({ day, visitor }, { onConflict: 'day,visitor', ignoreDuplicates: true });
}

export type VisitStats = {
  /** 테이블이 준비됐는지(없으면 SQL 1회 실행 필요) */
  ready: boolean;
  today: number;
  yesterday: number;
  total: number;
  /** 최근 7일(오래된 날 → 오늘) */
  days: { date: string; count: number }[];
  /** 집계 시작일(첫 기록) */
  since: string | null;
};

const EMPTY: VisitStats = { ready: false, today: 0, yesterday: 0, total: 0, days: [], since: null };

export async function getVisitStats(today: string): Promise<VisitStats> {
  const sb = getSupabaseAdmin();
  if (!sb) return EMPTY;
  const from = addDays(today, -6);
  const count = (day?: string) => {
    const q = sb.from(TABLE).select('visitor', { count: 'exact', head: true });
    return day ? q.eq('day', day) : q;
  };
  const [t, y, all, recent, first] = await Promise.all([
    count(today),
    count(addDays(today, -1)),
    count(),
    sb.from(TABLE).select('day').gte('day', from).lte('day', today).limit(20000),
    sb.from(TABLE).select('day').order('day', { ascending: true }).limit(1)
  ]);
  if (t.error || all.error || recent.error) return EMPTY; // 테이블 없음(42P01) 등

  const perDay = new Map<string, number>();
  for (const r of (recent.data ?? []) as { day: string }[]) perDay.set(r.day, (perDay.get(r.day) ?? 0) + 1);
  return {
    ready: true,
    today: t.count ?? 0,
    yesterday: y.count ?? 0,
    total: all.count ?? 0,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from, i);
      return { date, count: perDay.get(date) ?? 0 };
    }),
    since: ((first.data ?? []) as { day: string }[])[0]?.day ?? null
  };
}
