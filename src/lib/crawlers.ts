/**
 * AI·검색 크롤러 구분 — 미들웨어가 운영에서 봇 방문만 기록한다(crawler_visits). 범용 순수 모듈.
 * AI 크롤러는 용도가 다르다(OpenAI 안내 기준): GPTBot=모델 학습, OAI-SearchBot=ChatGPT 검색 색인,
 * ChatGPT-User=사용자가 대화 중 링크를 열게 함. 검색 노출에 중요한 건 검색·사용자 요청 쪽.
 */

export type Crawler = { name: string; kind: 'ai' | 'search' };

/** 위에서부터 먼저 맞는 것(구체적인 이름 먼저). */
const RULES: [RegExp, Crawler][] = [
  [/OAI-SearchBot/i, { name: 'OAI-SearchBot', kind: 'ai' }],
  [/ChatGPT-User/i, { name: 'ChatGPT-User', kind: 'ai' }],
  [/GPTBot/i, { name: 'GPTBot', kind: 'ai' }],
  [/Claude-SearchBot/i, { name: 'Claude-SearchBot', kind: 'ai' }],
  [/Claude-User/i, { name: 'Claude-User', kind: 'ai' }],
  [/ClaudeBot/i, { name: 'ClaudeBot', kind: 'ai' }],
  [/Perplexity-User/i, { name: 'Perplexity-User', kind: 'ai' }],
  [/PerplexityBot/i, { name: 'PerplexityBot', kind: 'ai' }],
  [/Google-CloudVertexBot/i, { name: 'Google-CloudVertexBot', kind: 'ai' }],
  [/DuckAssistBot/i, { name: 'DuckAssistBot', kind: 'ai' }],
  [/MistralAI-User/i, { name: 'MistralAI-User', kind: 'ai' }],
  [/meta-externalagent/i, { name: 'Meta-ExternalAgent', kind: 'ai' }],
  [/Bytespider/i, { name: 'Bytespider', kind: 'ai' }],
  [/CCBot/i, { name: 'CCBot', kind: 'ai' }],
  [/Amazonbot/i, { name: 'Amazonbot', kind: 'ai' }],
  [/Applebot/i, { name: 'Applebot', kind: 'search' }],
  [/Googlebot/i, { name: 'Googlebot', kind: 'search' }],
  [/bingbot/i, { name: 'Bingbot', kind: 'search' }],
  [/Yeti\//i, { name: 'Yeti(네이버)', kind: 'search' }],
  [/Daumoa/i, { name: 'Daumoa(다음)', kind: 'search' }]
];

/** UA → 크롤러. 사람·모르는 봇은 null(기록하지 않음). */
export function crawlerOf(userAgent: string): Crawler | null {
  if (!userAgent) return null;
  return RULES.find(([re]) => re.test(userAgent))?.[1] ?? null;
}

/** 저장할 주소 — 경로만(쿼리 제외), 200자까지. */
export function crawlerPath(pathname: string): string {
  return pathname.split('?')[0].slice(0, 200);
}

const KIND_BY_NAME = new Map(RULES.map(([, c]) => [c.name, c.kind]));

export type CrawlerRow = { day: string; bot: string; path: string };
export type CrawlerSummary = {
  bot: string;
  kind: Crawler['kind'];
  /** 다녀간 날 수 */
  days: number;
  /** 하루·주소 기준 방문 수(같은 날 같은 주소는 1) */
  hits: number;
  lastDay: string;
  /** 많이 본 주소(최대 5개) */
  topPaths: string[];
};

/** 봇별 요약 — AI 먼저, 같은 종류는 방문 수 많은 순. */
export function summarizeCrawlers(rows: CrawlerRow[]): CrawlerSummary[] {
  const byBot = new Map<string, CrawlerRow[]>();
  for (const r of rows) (byBot.get(r.bot) ?? byBot.set(r.bot, []).get(r.bot)!).push(r);
  const out = [...byBot].map(([bot, list]): CrawlerSummary => {
    const paths = new Map<string, number>();
    for (const r of list) paths.set(r.path, (paths.get(r.path) ?? 0) + 1);
    return {
      bot,
      kind: KIND_BY_NAME.get(bot) ?? 'search',
      days: new Set(list.map((r) => r.day)).size,
      hits: list.length,
      lastDay: list.reduce((d, r) => (r.day > d ? r.day : d), ''),
      topPaths: [...paths].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p)
    };
  });
  return out.sort((a, b) => (a.kind === b.kind ? b.hits - a.hits : a.kind === 'ai' ? -1 : 1));
}
