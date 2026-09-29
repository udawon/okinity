/**
 * 한국어 → 영어/일본어 자동 번역(Claude Messages API). 콘텐츠 동기화(lib/content-sync-server)가 쓴다.
 * 요청·응답 처리는 순수 함수로 분리해 테스트하고, 실제 호출은 translateTexts 한 곳에서만 한다.
 *
 * 환경 변수: ANTHROPIC_API_KEY(없으면 번역하지 않음 → null), TRANSLATE_MODEL(기본 claude-sonnet-5),
 * ANTHROPIC_BASE_URL(샌드박스 시험용 가짜 서버 주소).
 */
import type { TextMap } from './content-sync';

export type TranslateTarget = 'en' | 'ja';

const DEFAULT_MODEL = 'claude-sonnet-5';

const LANGUAGE: Record<TranslateTarget, string> = { en: 'English', ja: 'Japanese' };

const STYLE: Record<TranslateTarget, string> = {
  en: [
    '- Tone: natural, friendly American English for travelers (marketing copy, not literal).',
    "- Yen amounts: write the yen sign before the number, e.g. '1인 6,000엔' → '¥6,000 per person'. Korean won → 'KRW'.",
    "- Instructor: '허 범영' → 'Beomyoung Heo'; '포뇨(강사)' → 'Instructor Ponyo'.",
    '- Places: 푸른동굴 → Blue Cave, 케라마 → Kerama, 오키나와 → Okinawa, 나하 → Naha, 온나손 → Onna, 기노완 → Ginowan.',
    '- PADI course names in official English (Open Water Diver, Advanced Open Water Diver).'
  ].join('\n'),
  ja: [
    '- Tone: polite です・ます style used by Japanese tour operators (natural, not literal).',
    "- Yen amounts: number followed by 円, e.g. '1인 6,000엔' → 'お一人様 6,000円'. Korean won → 'ウォン'.",
    "- Instructor: '허 범영' → 'ホ・ボミョン'; '포뇨(강사)' → 'ポニョインストラクター'.",
    '- Places: 푸른동굴 → 青の洞窟, 케라마 → 慶良間, 오키나와 → 沖縄, 나하 → 那覇, 온나손 → 恩納村, 기노완 → 宜野湾.',
    '- Use official Japanese terms for licenses and courses (e.g. 一級小型船舶操縦免許, オープン・ウォーター).'
  ].join('\n')
};

export type TranslateRequest = {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: 'user'; content: string }[];
};

/** 번역 요청 본문 — 글마다 id(경로)를 붙인 JSON 을 보내고 같은 id 의 JSON 으로 받는다. */
export function buildTranslateRequest(texts: TextMap, target: TranslateTarget, model: string): TranslateRequest {
  const system = [
    `You translate Korean website content of OKINITY, a Korean-run marine tour company in Okinawa (snorkeling, scuba diving, PADI courses, fishing, yacht cruising), into ${LANGUAGE[target]}.`,
    'Input: a JSON object mapping ids to Korean text. Output: ONLY a JSON object with exactly the same ids mapping to the translated text. No explanations.',
    'Rules:',
    '- Translate faithfully. Do not add, drop, or summarize information.',
    '- Keep every number, price, time, date, quantity, phone number, URL, email, emoji, and the brand name OKINITY exactly as written.',
    '- Keep line breaks and line-start markers exactly (e.g. "##", "->", "*", "-", "★", "•", "1.").',
    '- Text that is already not Korean (English words, model names) stays as is. Empty strings stay empty.',
    STYLE[target]
  ].join('\n');
  return {
    model,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: JSON.stringify(texts) }]
  };
}

/** 응답 글에서 JSON 을 꺼내 요청한 id 의 번역만 돌려준다. 하나라도 빠지면 null. */
export function parseTranslateResponse(text: string, ids: string[]): TextMap | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const out: TextMap = {};
  for (const id of ids) {
    const v = (data as Record<string, unknown>)[id];
    if (typeof v !== 'string') return null;
    out[id] = v;
  }
  return out;
}

/** 자동 번역이 켜져 있는지(키 설정 여부). */
export function translationEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * 글 묶음 번역 — 실패하면 null(호출부는 기존 번역 유지). 응답 형식이 틀리면 한 번 더 시도한다.
 * 비어 있는 묶음은 호출하지 않는다. deadline(ms 시각)까지 끝나지 않으면 포기 — 서버 함수 시간 한도 보호.
 */
export async function translateTexts(
  texts: TextMap,
  target: TranslateTarget,
  deadline: number = Date.now() + 50_000
): Promise<TextMap | null> {
  const ids = Object.keys(texts);
  if (!ids.length) return {};
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const body = JSON.stringify(buildTranslateRequest(texts, target, process.env.TRANSLATE_MODEL || DEFAULT_MODEL));
  const url = `${process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'}/v1/messages`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body,
        signal: AbortSignal.timeout(Math.min(45_000, remaining))
      });
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) continue;
        return null;
      }
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = (data.content ?? []).map((c) => (c.type === 'text' ? c.text ?? '' : '')).join('');
      const parsed = parseTranslateResponse(text, ids);
      if (parsed) return parsed;
    } catch {
      // 네트워크·시간 초과 — 한 번 더 시도
    }
  }
  return null;
}
