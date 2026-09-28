import Link from 'next/link';
import { getInquiryStore } from '@/lib/inquiries';
import { getSiteContent, getSiteContentMap, CONTENT_KEYS, localizedContentKey } from '@/lib/site-content';
import { parseSettlementMap } from '@/lib/inquiry-settlement';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { TOUR_CATALOG, resolveTourDetail } from '@/lib/tour';
import { parseTourTimes } from '@/lib/tour-times';
import { parseBlogItems, publishedSorted } from '@/lib/blog';
import { jstDateKey } from '@/lib/visit-key';
import { getVisitStats } from '@/lib/visits';
import { pendingInquiries, siteChecks, upcomingInquiries } from '@/lib/admin-dashboard';
import AdminShell from '@/components/admin/AdminShell';
import StatusControl from '@/components/admin/StatusControl';

// 항상 최신 데이터를 보여줘야 하므로 동적 렌더링.
export const dynamic = 'force-dynamic';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function shortDate(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAY[d.getUTCDay()]})`;
}

function ago(iso: string, now: number): string {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 60) return `${min}분 전`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

const card = 'rounded-card border border-line bg-surface';

/**
 * 어드민 첫 화면 "오늘" — 들어오자마자 할 일과 사이트 상태를 본다.
 * 방문자 · 확정이 필요한 문의 · 다가오는 7일 · 사이트 점검. (예약 목록 전체는 /admin/reservations)
 */
export default async function AdminTodayPage() {
  const enabled = isSupabaseEnabled();
  const today = jstDateKey();
  const now = Date.now();

  const store = await getInquiryStore();
  const inquiries = await store.list();
  const settlements = enabled ? parseSettlementMap(await getSiteContent(CONTENT_KEYS.inquirySettlement)) : {};

  const tourKeys = TOUR_CATALOG.flatMap((t) => {
    const k = CONTENT_KEYS.tour(t.slug);
    return [k, localizedContentKey(k, 'en'), localizedContentKey(k, 'ja')];
  });
  const map = enabled ? await getSiteContentMap([...tourKeys, CONTENT_KEYS.tourTimes, CONTENT_KEYS.blog]) : {};
  const times = parseTourTimes(map[CONTENT_KEYS.tourTimes]);
  const lastBlog = publishedSorted(parseBlogItems(map[CONTENT_KEYS.blog]?.items))[0];

  const visits = await getVisitStats(today);
  const pending = pendingInquiries(inquiries);
  const upcoming = upcomingInquiries(inquiries, settlements, today);
  const checks = enabled
    ? siteChecks({
        tours: TOUR_CATALOG.map((t) => {
          const k = CONTENT_KEYS.tour(t.slug);
          return {
            slug: t.slug,
            name: t.name,
            ko: resolveTourDetail(t.slug, map[k] ?? null),
            hasEn: Boolean(map[localizedContentKey(k, 'en')]),
            hasJa: Boolean(map[localizedContentKey(k, 'ja')]),
            times: times[t.slug] ?? []
          };
        }),
        lastBlogDate: lastBlog?.date ?? null,
        today
      })
    : [];

  const maxDay = Math.max(1, ...visits.days.map((d) => d.count));
  const upcomingByDate = upcoming.reduce<Record<string, typeof upcoming>>((acc, x) => {
    (acc[x.date] ??= []).push(x);
    return acc;
  }, {});

  const stats = [
    {
      label: '오늘 방문자',
      value: visits.ready ? visits.today.toLocaleString() : '—',
      sub: visits.ready ? `어제 ${visits.yesterday.toLocaleString()}명` : '설정 필요'
    },
    {
      label: '누적 방문자',
      value: visits.ready ? visits.total.toLocaleString() : '—',
      sub: visits.since ? `${visits.since.slice(5).replace('-', '/')}부터 집계` : '집계 시작 전'
    },
    { label: '확정이 필요한 문의', value: String(pending.length), sub: pending[0] ? `가장 최근 ${ago(pending[0].createdAt, now)}` : '모두 처리됨', warn: pending.length > 0 },
    { label: '다가오는 7일 예약', value: String(upcoming.length), sub: upcoming[0] ? `다음: ${shortDate(upcoming[0].date)} ${upcoming[0].time}` : '예정 없음' }
  ];

  return (
    <AdminShell title="오늘">
      <p className="-mt-3 text-sm text-muted">{shortDate(today)} · 오키나와 기준</p>

      {/* 요약 숫자 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-4 sm:p-5 ${s.warn ? 'border-amber-300 bg-amber-50' : ''}`}>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* 확정이 필요한 문의 */}
          <section className={card}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-bold text-ink">확정이 필요한 문의</h2>
              <Link href="/admin/reservations" className="text-sm font-medium text-brand hover:underline">
                예약 관리 →
              </Link>
            </div>
            {pending.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">확정을 기다리는 문의가 없어요.</p>
            ) : (
              <ul className="divide-y divide-line">
                {pending.slice(0, 6).map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {q.name} <span className="font-normal text-muted">· {q.product || '투어 미선택'}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {q.date ? shortDate(q.date.slice(0, 10)) : '날짜 미정'}
                        {q.time ? ` ${q.time}` : ''} · {q.people ?? '?'}명 · {ago(q.createdAt, now)} 접수
                      </p>
                    </div>
                    <StatusControl id={q.id} status={q.status} />
                  </li>
                ))}
              </ul>
            )}
            {pending.length > 6 && (
              <p className="border-t border-line px-5 py-3 text-sm text-muted">외 {pending.length - 6}건은 예약 관리에서 확인하세요.</p>
            )}
          </section>

          {/* 다가오는 7일 */}
          <section className={card}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-bold text-ink">다가오는 7일</h2>
              <Link href="/admin/board" className="text-sm font-medium text-brand hover:underline">
                운영 보드 →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">7일 안에 잡힌 예약이 없어요.</p>
            ) : (
              <div className="divide-y divide-line">
                {Object.entries(upcomingByDate).map(([date, items]) => (
                  <div key={date} className="flex gap-4 px-5 py-3.5">
                    <p className="w-20 shrink-0 text-sm font-bold text-ink">
                      {date === today ? '오늘' : shortDate(date)}
                    </p>
                    <ul className="min-w-0 flex-1 space-y-1.5">
                      {items.map(({ inquiry: q, time }) => (
                        <li key={q.id} className="flex items-center gap-3 text-sm">
                          <span className="w-12 shrink-0 font-semibold text-ink">{time || '—'}</span>
                          <span className="min-w-0 flex-1 truncate text-ink">
                            {q.product || '투어 미선택'} · {q.people ?? '?'}명 · {q.name}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              q.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {q.status === 'confirmed' ? '확정' : '가예약'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* 방문자 */}
          <section className={`${card} p-5`}>
            <h2 className="text-base font-bold text-ink">방문자 · 최근 7일</h2>
            {visits.ready ? (
              <>
                <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="최근 7일 방문자 막대그래프">
                  {visits.days.map((d) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-ink">{d.count}</span>
                      <div
                        className={`w-full rounded-t-md ${d.date === today ? 'bg-brand' : 'bg-brand/30'}`}
                        style={{ height: `${Math.max(4, (d.count / maxDay) * 88)}px` }}
                      />
                      <span className="text-xs text-muted">{WEEKDAY[new Date(`${d.date}T00:00:00Z`).getUTCDay()]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  하루에 같은 사람(같은 인터넷·같은 기기)은 1명으로 셉니다. 검색엔진 로봇과 관리자 본인 접속은 빼고 셉니다.
                </p>
              </>
            ) : (
              <div className="mt-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                <p className="font-semibold">방문자 카운터를 켜려면 한 번만 설정이 필요해요.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Supabase 대시보드 → 왼쪽 메뉴 SQL Editor</li>
                  <li>
                    저장소의 <code>docs/supabase-site-visits.sql</code> 내용을 붙여넣고 RUN
                  </li>
                  <li>배포된 사이트에 접속하면 그때부터 집계돼요.</li>
                </ol>
              </div>
            )}
          </section>

          {/* 사이트 점검 */}
          <section className={card}>
            <h2 className="border-b border-line px-5 py-4 text-base font-bold text-ink">사이트 점검</h2>
            {checks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">손님 화면에서 빠진 곳이 없어요.</p>
            ) : (
              <ul className="divide-y divide-line">
                {checks.map((c) => (
                  <li key={c.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          c.tone === 'warn' ? 'bg-amber-500' : c.tone === 'ok' ? 'bg-emerald-500' : 'bg-brand'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{c.title}</p>
                        <p className="mt-0.5 text-xs text-muted">{c.detail}</p>
                        {c.items.length > 0 && (
                          <details className="mt-1 text-xs text-muted">
                            <summary className="cursor-pointer text-brand">목록 보기</summary>
                            <p className="mt-1 leading-relaxed">{c.items.join(', ')}</p>
                          </details>
                        )}
                      </div>
                      <Link href={c.href} className="shrink-0 text-sm font-medium text-brand hover:underline">
                        열기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
