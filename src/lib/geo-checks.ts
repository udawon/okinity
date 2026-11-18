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
