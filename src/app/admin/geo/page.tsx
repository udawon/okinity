import { getInquiryStore } from '@/lib/inquiries';
import { isSupabaseEnabled } from '@/lib/supabase/server';
import { jstDateKey } from '@/lib/visit-key';
import { addDays } from '@/lib/admin-dashboard';
import { getSourceStats } from '@/lib/visits';
import { listCrawlerRows, listGeoChecks } from '@/lib/geo-store';
import { summarizeCrawlers } from '@/lib/crawlers';
import { GEO_PLATFORMS, GEO_QUESTIONS, monthMatrix, summarizeByMonth, type GeoTally } from '@/lib/geo-checks';
import { isAiSource, sourceLabel, sourceSummary, summarizeInquirySources } from '@/lib/traffic-source';
import AdminShell from '@/components/admin/AdminShell';
import GeoCheckForm from '@/components/admin/GeoCheckForm';

export const dynamic = 'force-dynamic';

const card = 'rounded-card border border-line bg-surface';

/** 크롤러 설명 — 어떤 봇이 무엇을 위해 오는지(원님이 표를 읽을 수 있게). */
const BOT_NOTES: Record<string, string> = {
  'OAI-SearchBot': 'ChatGPT 검색 답변용',
  'ChatGPT-User': 'ChatGPT 사용자가 대화 중 열어 봄',
  GPTBot: 'OpenAI 학습용',
  'Claude-SearchBot': 'Claude 검색 답변용',
  'Claude-User': 'Claude 사용자가 대화 중 열어 봄',
  ClaudeBot: 'Anthropic 학습용',
  PerplexityBot: 'Perplexity 검색 답변용',
  'Perplexity-User': 'Perplexity 사용자가 열어 봄',
  Googlebot: '구글 검색·AI 개요',
  'Yeti(네이버)': '네이버 검색·AI 브리핑',
  Bingbot: 'Bing·Copilot 검색'
};

function pct(n: number, d: number): string {
  return d ? `${Math.round((n / d) * 100)}%` : '—';
}

function tallyText(t?: GeoTally): string {
  return t ? `${t.mentioned} · ${t.cited} · ${t.recommended} / ${t.checks}` : '—';
}

export default async function AdminGeoPage() {
  const enabled = isSupabaseEnabled();
  const today = jstDateKey();
  const from30 = addDays(today, -29);
  const since90 = new Date(`${addDays(today, -89)}T00:00:00+09:00`).toISOString();

  const [sources, crawlers, geo, inquiries] = await Promise.all([
    getSourceStats(from30, today),
    listCrawlerRows(from30, today),
    listGeoChecks(),
    enabled ? getInquiryStore().then((s) => s.list()) : Promise.resolve([])
  ]);
  const inq = summarizeInquirySources(inquiries.filter((i) => i.createdAt >= since90));
  const bots = summarizeCrawlers(crawlers.rows);
  const aiBots = bots.filter((b) => b.kind === 'ai');
  const months = summarizeByMonth(geo.checks);
  const latest = months[0];
  const matrix = latest ? monthMatrix(geo.checks, latest.month) : {};
  const aiVisits = sources.rows.filter((r) => isAiSource(r.source)).reduce((n, r) => n + r.count, 0);
  const maxSource = Math.max(1, ...sources.rows.map((r) => r.count));
  const notReady = enabled && (!sources.ready || !crawlers.ready || !geo.ready);

  const stats = [
    { label: 'AI에서 온 방문자 · 30일', value: sources.ready ? String(aiVisits) : '—', sub: sources.ready ? `전체 ${sources.total}명 중 ${pct(aiVisits, sources.total)}` : 'SQL 실행 필요' },
    { label: 'AI가 거친 예약 문의 · 90일', value: String(inq.ai.length), sub: `유입 기록된 문의 ${inq.tracked}건 중` },
    { label: 'AI 크롤러 방문 · 30일', value: crawlers.ready ? String(aiBots.reduce((n, b) => n + b.hits, 0)) : '—', sub: crawlers.ready ? `${aiBots.length}종` : 'SQL 실행 필요' },
    {
      label: latest ? `AI 답변 언급 · ${latest.month.replace('-', '년 ')}월` : 'AI 답변 언급',
      value: latest ? `${latest.total.mentioned}/${latest.total.checks}` : '—',
      sub: latest ? `출처 ${latest.total.cited} · 추천 ${latest.total.recommended}` : '첫 기록 전'
    }
  ];

  return (
    <AdminShell title="AI 노출 측정">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        ChatGPT·구글 AI 개요·네이버 AI 브리핑·Claude 같은 AI 검색에 오키니티가 얼마나 나오고, 거기서 손님이 얼마나
        들어와 문의하는지 봅니다. 유입 기록은 이 기능이 배포된 뒤 방문·문의부터 쌓입니다.
      </p>

      {notReady && (
        <div className="mb-4 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <p className="font-semibold">처음 한 번 설정이 필요해요</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Supabase 대시보드 → 왼쪽 메뉴 SQL Editor</li>
            <li>
              저장소의 <code>docs/supabase-geo-tracking.sql</code> 내용을 붙여넣고 RUN
            </li>
            <li>이 화면을 새로고침하면 이 안내가 사라집니다.</li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-4`}>
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 유입 경로 */}
        <section className={`${card} p-5`}>
          <h2 className="text-base font-bold text-ink">방문 유입 경로 · 최근 30일</h2>
          <p className="mt-1 text-xs text-muted">하루 한 명으로 센 방문자의 그날 첫 유입처입니다.</p>
          {sources.rows.length ? (
            <ul className="mt-3 space-y-1.5">
              {sources.rows.map((r) => (
                <li key={r.source} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 truncate text-ink" title={sourceLabel(r.source)}>
                    {sourceLabel(r.source)}
                    {isAiSource(r.source) && <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] font-bold text-sky-700">AI</span>}
                  </span>
                  <span className="h-2 flex-1 rounded-full bg-line">
                    <span
                      className={`block h-2 rounded-full ${isAiSource(r.source) ? 'bg-brand' : 'bg-brand/40'}`}
                      style={{ width: `${(r.count / maxSource) * 100}%` }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-ink">
                    {r.count} <span className="text-xs text-muted">{pct(r.count, sources.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">아직 기록이 없습니다.</p>
          )}
        </section>

        {/* 예약 문의 유입 */}
        <section className={`${card} p-5`}>
          <h2 className="text-base font-bold text-ink">예약 문의 유입 · 최근 90일</h2>
          <p className="mt-1 text-xs text-muted">처음 들어온 경로(30일 기억)와 문의 직전 경로입니다.</p>
          {inq.ai.length ? (
            <ul className="mt-3 divide-y divide-line text-sm">
              {inq.ai.map((i) => (
                <li key={i.id} className="py-2">
                  <p className="text-ink">
                    {i.createdAt.slice(5, 10).replace('-', '/')} · {i.name} · {i.product ?? '상품 미선택'}
                  </p>
                  <p className="text-xs font-semibold text-sky-700">{sourceSummary(i)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">AI를 거친 문의는 아직 없습니다.</p>
          )}
          {inq.byFirst.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              처음 유입처: {inq.byFirst.map((r) => `${sourceLabel(r.source)} ${r.count}`).join(' · ')}
            </p>
          )}
        </section>
      </div>

      {/* 크롤러 */}
      <section className={`${card} mt-4 p-5`}>
        <h2 className="text-base font-bold text-ink">AI·검색 크롤러 방문 · 최근 30일</h2>
        <p className="mt-1 text-xs text-muted">
          봇이 사이트 글을 읽어 간 기록입니다(같은 날 같은 주소는 1회). 검색 답변용 봇이 꾸준히 와야 AI 답변에 나올 수 있어요.
        </p>
        {bots.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">봇</th>
                  <th className="py-2 pr-3 font-medium">용도</th>
                  <th className="py-2 pr-3 text-right font-medium">다녀간 날</th>
                  <th className="py-2 pr-3 text-right font-medium">방문</th>
                  <th className="py-2 pr-3 font-medium">마지막</th>
                  <th className="py-2 font-medium">많이 본 주소</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bots.map((b) => (
                  <tr key={b.bot}>
                    <td className="py-2 pr-3 font-semibold text-ink">
                      {b.bot}
                      {b.kind === 'ai' && <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] font-bold text-sky-700">AI</span>}
                    </td>
                    <td className="py-2 pr-3 text-muted">{BOT_NOTES[b.bot] ?? ''}</td>
                    <td className="py-2 pr-3 text-right text-ink">{b.days}</td>
                    <td className="py-2 pr-3 text-right text-ink">{b.hits}</td>
                    <td className="py-2 pr-3 text-ink">{b.lastDay.slice(5).replace('-', '/')}</td>
                    <td className="py-2 text-xs text-muted">{b.topPaths.slice(0, 3).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">아직 기록이 없습니다.</p>
        )}
      </section>

      {/* AI 답변 기록 */}
      <section className={`${card} mt-4 p-5`}>
        <h2 className="text-base font-bold text-ink">AI 답변 기록 · 월 1회</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          매달 같은 질문 10개를 플랫폼마다 물어보고 결과를 체크합니다. 로그인한 상태로 <b>새 대화</b>를 열고(ChatGPT는 웹 검색
          켜기) 질문을 그대로 붙여넣으세요. 구글·네이버는 검색창에 질문을 넣고 맨 위 AI 요약을 봅니다.
          <br />
          <b>언급</b>=오키니티 이름이 나옴 · <b>출처(링크)</b>=okinity.com 이 출처 링크로 나옴 · <b>추천</b>=추천 목록에 들어감
        </p>

        {months.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-1 text-xs text-muted">월별 — 언급 · 출처 · 추천 / 물어본 질문 수</p>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">월</th>
                  {GEO_PLATFORMS.map((p) => (
                    <th key={p} className="py-2 pr-3 font-medium">
                      {p}
                    </th>
                  ))}
                  <th className="py-2 font-medium">합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 pr-3 font-semibold text-ink">{m.month}</td>
                    {GEO_PLATFORMS.map((p) => (
                      <td key={p} className="py-2 pr-3 text-ink">
                        {tallyText(m.byPlatform[p])}
                      </td>
                    ))}
                    <td className="py-2 font-semibold text-ink">{tallyText(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {latest && (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-1 text-xs text-muted">{latest.month} 질문별 결과</p>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">질문</th>
                  {GEO_PLATFORMS.map((p) => (
                    <th key={p} className="py-2 pr-3 font-medium">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...GEO_QUESTIONS, ...Object.keys(matrix).filter((q) => !(GEO_QUESTIONS as readonly string[]).includes(q))].map(
                  (q) => (
                    <tr key={q}>
                      <td className="py-2 pr-3 text-ink">{q}</td>
                      {GEO_PLATFORMS.map((p) => {
                        const c = matrix[q]?.[p];
                        const tags = c ? [c.mentioned && '언급', c.cited && '출처', c.recommended && '추천'].filter(Boolean) : [];
                        return (
                          <td key={p} className="py-2 pr-3 text-xs" title={c?.summary ?? ''}>
                            {!c ? (
                              <span className="text-muted">미기록</span>
                            ) : tags.length ? (
                              <span className="font-semibold text-sky-700">{tags.join('·')}</span>
                            ) : (
                              <span className="text-muted">없음</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-sm font-bold text-ink">기록하기</h3>
          <GeoCheckForm checks={geo.checks} today={today} disabled={!enabled || !geo.ready} />
        </div>
      </section>
    </AdminShell>
  );
}
