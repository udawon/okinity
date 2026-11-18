import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { fetchAllPages } from './db-paging';
import type { CrawlerRow } from './crawlers';
import type { GeoCheck, NewGeoCheck } from './geo-checks';

/**
 * GEO 측정 저장소 — AI 답변 기록(geo_checks)·크롤러 방문(crawler_visits) 읽기·쓰기(서버 전용, service_role).
 * 표는 docs/supabase-geo-tracking.sql 로 만든다. 표가 없으면 ready:false 로 알려 화면이 안내를 띄운다.
 */

type GeoRow = {
  id: string;
  checked_on: string;
  platform: string;
  question: string;
  mentioned: boolean;
  cited: boolean;
  recommended: boolean;
  cited_url: string | null;
  competitors: string | null;
  summary: string | null;
  created_at: string;
};

const toCheck = (r: GeoRow): GeoCheck => ({
  id: r.id,
  checkedOn: r.checked_on,
  platform: r.platform,
  question: r.question,
  mentioned: r.mentioned,
  cited: r.cited,
  recommended: r.recommended,
  citedUrl: r.cited_url ?? undefined,
  competitors: r.competitors ?? undefined,
  summary: r.summary ?? undefined,
  createdAt: r.created_at
});

function client() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다.');
  return sb;
}

/** AI 답변 기록 전체(최근 날짜부터). */
export async function listGeoChecks(): Promise<{ ready: boolean; checks: GeoCheck[] }> {
  if (!getSupabaseAdmin()) return { ready: false, checks: [] };
  const { data, error } = await fetchAllPages<GeoRow>((a, b) =>
    client().from('geo_checks').select('*').order('checked_on', { ascending: false }).order('created_at').range(a, b)
  );
  return error ? { ready: false, checks: [] } : { ready: true, checks: data.map(toCheck) };
}

/** 한 날짜·플랫폼 기록을 통째로 저장(같은 날짜·플랫폼을 다시 저장하면 덮어쓴다). */
export async function replaceGeoChecks(checkedOn: string, platform: string, items: NewGeoCheck[]): Promise<void> {
  const sb = client();
  const del = await sb.from('geo_checks').delete().eq('checked_on', checkedOn).eq('platform', platform);
  if (del.error) throw new Error(`기존 기록 정리 실패: ${del.error.message}`);
  if (!items.length) return;
  const { error } = await sb.from('geo_checks').insert(
    items.map((c) => ({
      checked_on: c.checkedOn,
      platform: c.platform,
      question: c.question,
      mentioned: c.mentioned,
      cited: c.cited,
      recommended: c.recommended,
      cited_url: c.citedUrl || null,
      competitors: c.competitors || null,
      summary: c.summary || null
    }))
  );
  if (error) throw new Error(`저장 실패: ${error.message}`);
}

/** 크롤러 방문 기록(기간 포함). */
export async function listCrawlerRows(from: string, to: string): Promise<{ ready: boolean; rows: CrawlerRow[] }> {
  if (!getSupabaseAdmin()) return { ready: false, rows: [] };
  const { data, error } = await fetchAllPages<CrawlerRow>((a, b) =>
    client()
      .from('crawler_visits')
      .select('day, bot, path')
      .gte('day', from)
      .lte('day', to)
      .order('day')
      .order('bot')
      .order('path')
      .range(a, b)
  );
  return error ? { ready: false, rows: [] } : { ready: true, rows: data };
}
