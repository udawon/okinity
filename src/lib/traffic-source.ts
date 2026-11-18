/**
 * 유입처 분류 — 방문·예약 문의가 어디서 왔는지(AI 답변·검색·SNS·직접). 범용 순수 모듈(브라우저·서버 공용).
 * 개인정보 최소화: 사이트 이름(호스트)만 남기고 주소 전체·검색어는 저장하지 않는다.
 * 설계: docs/ai-discussions/20261118-GEO-측정.md
 */

/** 이름이 정해진 유입처. 그 외는 `other:<사이트 이름>`. */
const LABELS = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
  copilot: 'Copilot',
  google: '구글',
  naver: '네이버',
  daum: '다음',
  bing: 'Bing',
  yahoo: '야후',
  instagram: '인스타그램',
  facebook: '페이스북',
  youtube: '유튜브',
  kakao: '카카오',
  line: '라인',
  threads: '스레드',
  tiktok: '틱톡',
  direct: '직접 방문',
  internal: '사이트 내부'
} as const;
type KnownSource = keyof typeof LABELS;

const AI_SOURCES: ReadonlySet<string> = new Set(['chatgpt', 'claude', 'perplexity', 'gemini', 'copilot']);

/** 호스트(소문자, www. 제거) → 유입처. 위에서부터 먼저 맞는 것. */
const HOST_RULES: [RegExp, KnownSource][] = [
  [/^(chatgpt\.com|chat\.openai\.com)$/, 'chatgpt'],
  [/^claude\.ai$/, 'claude'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/^(gemini|bard)\.google\.com$/, 'gemini'],
  [/^copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)naver\.(com|me)$/, 'naver'],
  [/(^|\.)daum\.net$/, 'daum'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)yahoo\.(com|co\.jp)$/, 'yahoo'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)facebook\.com$/, 'facebook'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)kakao\.com$/, 'kakao'],
  [/(^|\.)line\.me$/, 'line'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)tiktok\.com$/, 'tiktok']
];

/** AI 답변 링크에 붙는 utm_source 값 → 유입처. */
const UTM_RULES: [RegExp, KnownSource][] = [
  [/^(chatgpt(\.com)?|openai)$/, 'chatgpt'],
  [/^(claude(\.ai)?|anthropic)$/, 'claude'],
  [/^perplexity(\.ai)?$/, 'perplexity'],
  [/^gemini$/, 'gemini'],
  [/^copilot$/, 'copilot']
];

/** referrer 가 없을 때 — 앱 안 브라우저(UA)로. */
const UA_RULES: [RegExp, KnownSource][] = [
  [/KAKAOTALK/i, 'kakao'],
  [/Instagram/, 'instagram'],
  [/FBAN|FBAV|FB_IAB/, 'facebook'],
  [/\bLine\//, 'line'],
  [/NAVER\(inapp/i, 'naver']
];

const OTHER_RE = /^other:[a-z0-9.-]{1,70}$/;

function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function hostOf(url: string): string | null {
  try {
    return bareHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

function utmOf(url: string): string | null {
  try {
    return new URL(url).searchParams.get('utm_source')?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * 유입처 분류 — utm_source(AI 답변 링크) > referrer 사이트 이름 > 앱 안 브라우저 > 직접 방문.
 * host: 우리 사이트 호스트(같으면 'internal').
 */
export function classifySource(input: { referrer?: string; url?: string; ua?: string; host: string }): string {
  const utm = input.url ? utmOf(input.url) : null;
  if (utm) {
    const hit = UTM_RULES.find(([re]) => re.test(utm));
    if (hit) return hit[1];
  }
  const ref = input.referrer ? hostOf(input.referrer) : null;
  if (ref) {
    if (ref === bareHost(input.host)) return 'internal';
    const hit = HOST_RULES.find(([re]) => re.test(ref));
    if (hit) return hit[1];
    const other = `other:${ref}`;
    return OTHER_RE.test(other) ? other : 'direct';
  }
  const ua = input.ua ?? '';
  const app = UA_RULES.find(([re]) => re.test(ua));
  return app ? app[1] : 'direct';
}

/** AI 답변에서 온 유입인지. */
export function isAiSource(id: string): boolean {
  return AI_SOURCES.has(id);
}

/** 어드민 표시 이름. */
export function sourceLabel(id: string): string {
  if (id in LABELS) return LABELS[id as KnownSource];
  return id.startsWith('other:') ? id.slice('other:'.length) : id;
}

/** 브라우저가 보낸 값 검증 — 아는 이름이나 `other:사이트이름`만 통과, 아니면 null. */
export function normalizeSourceId(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  if (v in LABELS) return v;
  return OTHER_RE.test(v) ? v : null;
}

/** 예약 문의 유입 표시 — "처음 ChatGPT · 마지막 네이버", 같으면 하나, 없으면 ''. */
export function sourceSummary(s: { sourceFirst?: string; sourceLast?: string }): string {
  const first = s.sourceFirst ? sourceLabel(s.sourceFirst) : '';
  const last = s.sourceLast ? sourceLabel(s.sourceLast) : '';
  if (first && last && first !== last) return `처음 ${first} · 마지막 ${last}`;
  return first || last;
}

/** 예약 문의 유입 요약 — 처음 유입처별 수(많은 순), AI 가 처음이나 마지막인 문의. */
export function summarizeInquirySources<T extends { sourceFirst?: string; sourceLast?: string }>(
  inquiries: T[]
): { total: number; tracked: number; ai: T[]; byFirst: { source: string; count: number }[] } {
  const counts = new Map<string, number>();
  for (const i of inquiries) if (i.sourceFirst) counts.set(i.sourceFirst, (counts.get(i.sourceFirst) ?? 0) + 1);
  return {
    total: inquiries.length,
    tracked: inquiries.filter((i) => i.sourceFirst || i.sourceLast).length,
    ai: inquiries.filter((i) => isAiSource(i.sourceFirst ?? '') || isAiSource(i.sourceLast ?? '')),
    byFirst: [...counts].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count)
  };
}
