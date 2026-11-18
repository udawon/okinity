import { z } from 'zod';

/**
 * AI 답변 기록(월 1회 수동) — 정해진 질문을 AI 들에 물어 오키니티 언급·출처·추천 여부를 남긴다.
 * 기준 글 체크리스트 5·6번. 질문·플랫폼은 달마다 비교하려고 고정(2026-11-18 원님 확정). 범용 순수 모듈.
 */

export const GEO_QUESTIONS = [
  '오키나와 푸른동굴 스노클링 업체 추천해줘',
  '오키나와에 한국인이 운영하는 다이빙샵 있어?',
  '오키나와 체험다이빙 가격 얼마야?',
  '오키나와 케라마 체험다이빙 투어 추천',
  '오키나와에서 오픈워터 자격증을 한국어로 딸 수 있는 곳',
  '수영 못해도 오키나와 스노클링 가능해?',
  '오키나와 아이랑 스노클링 몇 살부터 돼?',
  '오키나와 선상낚시 투어 한국어 가능한 곳',
  '오키나와 프라이빗 요트 투어 추천',
  '오키니티(OKINITY) 어때? 후기 알려줘'
] as const;

export const GEO_PLATFORMS = ['ChatGPT', '구글 AI 개요', '네이버 AI 브리핑', 'Claude'] as const;
export type GeoPlatform = (typeof GEO_PLATFORMS)[number];

/**
 * 플랫폼별 묻는 방법 — 어드민 기록 화면에서 고른 플랫폼 위에 띄운다(components/admin/GeoCheckForm·GeoManual).
 * 원칙: 지난 대화 기억·개인화가 답에 섞이지 않게(임시 채팅·시크릿 창), 질문마다 새로.
 */
export const GEO_PLATFORM_GUIDE: Record<GeoPlatform, { where: string; steps: string[] }> = {
  ChatGPT: {
    where: 'chatgpt.com 또는 ChatGPT 앱 (로그인)',
    steps: [
      '새 채팅 화면 오른쪽 위의 "임시 채팅"을 켭니다 — 지난 대화 기억이 답에 섞이지 않게',
      '질문을 붙여넣고 보냅니다',
      '답 아래 "출처"를 눌러 okinity.com 이 있는지 봅니다. 출처가 하나도 없으면 입력창의 + → "웹 검색"을 켜고 다시 물어봅니다',
      '다음 질문은 새 임시 채팅에서 합니다'
    ]
  },
  '구글 AI 개요': {
    where: '크롬 시크릿 창의 google.com (로그인 안 한 상태)',
    steps: [
      '시크릿 창을 엽니다 (윈도우 Ctrl+Shift+N · 맥 ⌘+Shift+N) — 검색 기록에 따른 개인화를 빼려고',
      'google.com 검색창에 질문을 붙여넣고 검색합니다',
      '맨 위 "AI 개요" 상자를 "더보기"로 펼쳐 내용과 옆의 링크를 봅니다',
      '"AI 모드" 탭은 누르지 않습니다(AI 개요만 기록). AI 개요가 안 나오면 체크 없이 메모에 "AI 개요 없음"'
    ]
  },
  '네이버 AI 브리핑': {
    where: 'naver.com 또는 네이버 앱',
    steps: [
      '네이버 검색창에 질문을 붙여넣고 검색합니다',
      '맨 위 "AI 브리핑" 내용과 아래 출처를 봅니다',
      'AI 브리핑이 안 나오면 체크 없이 메모에 "AI 브리핑 없음"'
    ]
  },
  Claude: {
    where: 'claude.ai 또는 Claude 앱 (로그인)',
    steps: [
      '새 대화를 엽니다 — 질문마다 새 대화',
      '입력창의 도구 메뉴에서 "웹 검색"이 켜져 있는지 확인합니다',
      '질문을 붙여넣고 보낸 뒤, 답 속 출처 링크에 okinity.com 이 있는지 봅니다'
    ]
  }
};

const blank = (v: unknown) => (v === null || v === undefined ? '' : v);
const text = (max: number) => z.preprocess(blank, z.string().trim().max(max));

/** 기록 입력 — 날짜·플랫폼·질문 필수. 출처 URL 은 http(s) 만(화면에 링크로 쓰므로). */
export const NewGeoCheckSchema = z.object({
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.string().trim().min(1).max(40),
  question: z.string().trim().min(1).max(200),
  mentioned: z.boolean().default(false),
  cited: z.boolean().default(false),
  recommended: z.boolean().default(false),
  citedUrl: text(500).refine((v) => v === '' || /^https?:\/\//i.test(v), 'http(s) 주소만'),
  competitors: text(300),
  summary: text(2000)
});
export type NewGeoCheck = z.infer<typeof NewGeoCheckSchema>;

export type GeoCheck = {
  id: string;
  checkedOn: string;
  platform: string;
  question: string;
  mentioned: boolean;
  cited: boolean;
  recommended: boolean;
  citedUrl?: string;
  competitors?: string;
  summary?: string;
  createdAt: string;
};

export type GeoTally = { checks: number; mentioned: number; cited: number; recommended: number };
export type GeoMonth = { month: string; total: GeoTally; byPlatform: Record<string, GeoTally> };

const empty = (): GeoTally => ({ checks: 0, mentioned: 0, cited: 0, recommended: 0 });
const add = (t: GeoTally, c: GeoCheck) => {
  t.checks++;
  if (c.mentioned) t.mentioned++;
  if (c.cited) t.cited++;
  if (c.recommended) t.recommended++;
};

/** 같은 달·플랫폼·질문은 최신 기록 하나만(다시 물어본 경우) — 달마다 분모가 질문 수로 유지되게. */
export function latestPerMonth(checks: GeoCheck[]): GeoCheck[] {
  const latest = new Map<string, GeoCheck>();
  for (const c of checks) {
    const key = `${c.checkedOn.slice(0, 7)}|${c.platform}|${c.question}`;
    const prev = latest.get(key);
    const newer = !prev || c.checkedOn > prev.checkedOn || (c.checkedOn === prev.checkedOn && c.createdAt > prev.createdAt);
    if (newer) latest.set(key, c);
  }
  return [...latest.values()];
}

/** 월별 집계 — 최근 달부터. */
export function summarizeByMonth(checks: GeoCheck[]): GeoMonth[] {
  const months = new Map<string, GeoMonth>();
  for (const c of latestPerMonth(checks)) {
    const month = c.checkedOn.slice(0, 7);
    const m = months.get(month) ?? { month, total: empty(), byPlatform: {} };
    add(m.total, c);
    add((m.byPlatform[c.platform] ??= empty()), c);
    months.set(month, m);
  }
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}

/** 그달 질문 × 플랫폼 표 — matrix[질문][플랫폼] = 최신 기록. */
export function monthMatrix(checks: GeoCheck[], month: string): Record<string, Record<string, GeoCheck>> {
  const matrix: Record<string, Record<string, GeoCheck>> = {};
  for (const c of latestPerMonth(checks)) {
    if (c.checkedOn.slice(0, 7) !== month) continue;
    (matrix[c.question] ??= {})[c.platform] = c;
  }
  return matrix;
}
