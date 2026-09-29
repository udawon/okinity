/**
 * 한국어 기준 번역 동기화 — 번역본(EN/JA)은 "한국어 문서 복제 + 번역 대상 글만 번역"으로 만든다.
 * 사진·요금 숫자·공개 여부·옵션 key·순서는 언제나 한국어와 같아서 언어별로 어긋날 수 없다.
 *
 * 번역 기억(원문 지도, src): 번역본의 각 칸이 "어떤 한국어 원문을 번역한 것인지" 기록한다.
 * 한국어 원문이 그대로면 기존 번역을 재사용하고(순서가 바뀌어도 원문 기준), 바뀐 칸만 번역한다.
 * 범용 순수 모듈(서버 의존 없음). 설계: docs/ai-discussions/20260929-한국어-기준-자동-번역.md
 */

export type TextMap = Record<string, string>;

/** 콘텐츠 종류별 번역 대상 경로 — `목록[]` 은 모든 항목. 그 외 칸은 한국어 값을 그대로 쓴다. */
export const SYNC_PATHS = {
  tour: [
    'summary',
    'duration',
    'age',
    'people',
    'startNote',
    'price',
    'priceMiddle',
    'priceLuxury',
    'included',
    'body',
    'steps[].name',
    'steps[].time',
    'options[].name',
    'options[].description'
  ],
  fishingClasses: ['middle.description', 'luxury.description'],
  about: [
    'eyebrow',
    'title',
    'intro',
    'body',
    'strengths[].title',
    'strengths[].desc',
    'instructorName',
    'instructorRole',
    'instructorCerts',
    'instructorBody'
  ],
  tourNotices: ['refund.title', 'refund.body', 'safety.title', 'safety.body'],
  gallery: ['items[].caption']
} as const;
export type SyncKind = keyof typeof SYNC_PATHS;

const HANGUL = /[가-힣]/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 문서에서 번역 대상 글을 뽑는다 → { 'steps.0.name': '집합', ... }. 글이 아닌 칸은 건너뛴다. */
export function textEntries(doc: unknown, patterns: readonly string[]): TextMap {
  const out: TextMap = {};
  const walk = (node: unknown, segs: string[], prefix: string) => {
    if (!segs.length) {
      if (typeof node === 'string') out[prefix] = node;
      return;
    }
    const [seg, ...rest] = segs;
    if (!isRecord(node)) return;
    if (seg.endsWith('[]')) {
      const list = node[seg.slice(0, -2)];
      if (!Array.isArray(list)) return;
      list.forEach((item, i) => walk(item, rest, `${prefix}${seg.slice(0, -2)}.${i}${rest.length ? '.' : ''}`));
    } else {
      walk(node[seg], rest, `${prefix}${seg}${rest.length ? '.' : ''}`);
    }
  };
  for (const p of patterns) walk(doc, p.split('.'), '');
  return out;
}

/**
 * 동기화 계획 — ready: 바로 쓸 글(빈 글·한글 없는 글은 그대로, 원문이 같으면 기존 번역),
 * pending: 번역해야 할 한국어 원문. glossary: 미리 정해 둔 번역(한국어 원문 → 번역, 예: 공통 안내 기본 문구).
 */
export function planSync(
  koTexts: TextMap,
  prevLocal: TextMap,
  prevSrc: TextMap,
  glossary: TextMap = {}
): { ready: TextMap; pending: TextMap } {
  const memory = new Map<string, string>(Object.entries(glossary));
  for (const [path, source] of Object.entries(prevSrc)) {
    if (typeof prevLocal[path] === 'string') memory.set(source, prevLocal[path]);
  }
  const ready: TextMap = {};
  const pending: TextMap = {};
  for (const [path, text] of Object.entries(koTexts)) {
    if (!text.trim() || !HANGUL.test(text)) ready[path] = text;
    else if (memory.has(text)) ready[path] = memory.get(text)!;
    else pending[path] = text;
  }
  return { ready, pending };
}

/**
 * 번역 결과 반영 — translated 가 null 이면(키 없음·API 실패) 번역할 칸은 기존 번역을 유지하고
 * (없으면 한국어), 원문 지도를 갱신하지 않아 "번역 필요"로 남긴다.
 */
export function finalizeSync(
  koTexts: TextMap,
  plan: { ready: TextMap; pending: TextMap },
  translated: TextMap | null,
  prevLocal: TextMap,
  prevSrc: TextMap
): { texts: TextMap; src: TextMap; translated: number; left: number } {
  const texts: TextMap = { ...plan.ready };
  const src: TextMap = {};
  for (const path of Object.keys(plan.ready)) src[path] = koTexts[path];
  let done = 0;
  let left = 0;
  for (const [path, source] of Object.entries(plan.pending)) {
    const t = translated?.[path];
    if (typeof t === 'string') {
      texts[path] = t;
      src[path] = source;
      done++;
    } else {
      left++;
      if (typeof prevLocal[path] === 'string' && prevLocal[path].trim()) {
        texts[path] = prevLocal[path];
        if (prevSrc[path] !== undefined) src[path] = prevSrc[path];
      } else {
        texts[path] = source;
      }
    }
  }
  return { texts, src, translated: done, left };
}

/** 번역본 조립 — 한국어 문서를 복제하고 지정 경로의 글만 바꾼다(원본 불변). */
export function buildLocalDoc<T>(ko: T, texts: TextMap): T {
  const doc = structuredClone(ko) as unknown;
  for (const [path, text] of Object.entries(texts)) {
    const segs = path.split('.');
    let node = doc as Record<string, unknown> | unknown[];
    for (let i = 0; i < segs.length - 1; i++) {
      node = (node as Record<string, unknown>)[segs[i]] as Record<string, unknown> | unknown[];
      if (typeof node !== 'object' || node === null) break;
    }
    if (typeof node === 'object' && node !== null) (node as Record<string, unknown>)[segs[segs.length - 1]] = text;
  }
  return doc as T;
}

/** 번역이 한국어보다 오래된 칸 수 — 한글이 있는 글 중 원문 지도와 다른 것. */
export function staleCount(koTexts: TextMap, src: TextMap): number {
  return Object.entries(koTexts).filter(([path, text]) => HANGUL.test(text) && src[path] !== text).length;
}

/**
 * EN/JA 탭에서 사람이 번역을 고쳐 저장했을 때의 원문 지도 — 바뀐 칸은 "지금 한국어를 번역한 것"으로
 * 기록해 다음 자동 번역이 덮어쓰지 않게 한다(그 칸의 한국어가 다시 바뀌기 전까지).
 */
export function manualEditSrc(koTexts: TextMap, prevLocal: TextMap, newLocal: TextMap, prevSrc: TextMap): TextMap {
  const src: TextMap = { ...prevSrc };
  for (const [path, text] of Object.entries(newLocal)) {
    if (text !== prevLocal[path] && koTexts[path] !== undefined) src[path] = koTexts[path];
  }
  return src;
}

/** 한국어 저장 뒤 번역 동기화 결과(서버 → 어드민 화면). */
export type SyncOutcome = {
  /** 자동 번역 켜짐(ANTHROPIC_API_KEY 설정) 여부 — 꺼져 있으면 번역본을 건드리지 않는다. */
  enabled: boolean;
  /** 언어별 새로 번역한 칸 / 번역 실패로 이전 번역(없으면 한국어)을 유지한 칸. */
  langs: { locale: 'en' | 'ja'; translated: number; left: number }[];
  /** 저장소 오류 등 — 한국어 저장은 이미 끝난 상태. */
  error?: string;
};

const LANG_NAME = { en: '영어', ja: '일본어' } as const;

/** 저장 메시지 뒤에 붙일 번역 결과 문구와 경고 여부(경고면 메시지를 지우지 않고 남긴다). */
export function syncMessage(o: SyncOutcome | undefined): { text: string; warn: boolean } {
  if (!o) return { text: '', warn: false };
  if (o.error) return { text: `영어·일본어 번역 반영 중 오류가 났습니다(${o.error}). 투어 상세 목록의 '번역 맞추기'로 다시 시도하세요.`, warn: true };
  if (!o.enabled) return { text: '자동 번역이 꺼져 있어 영어·일본어는 바뀌지 않았습니다.', warn: true };
  const failed = o.langs.filter((l) => l.left > 0);
  if (failed.length)
    return {
      text: `번역 실패: ${failed.map((l) => `${LANG_NAME[l.locale]} ${l.left}칸`).join(' · ')} — 이전 번역을 유지했습니다. 투어 상세 목록의 '번역 맞추기'로 다시 시도하세요.`,
      warn: true
    };
  const done = o.langs.filter((l) => l.translated > 0);
  if (done.length) return { text: `자동 번역: ${done.map((l) => `${LANG_NAME[l.locale]} ${l.translated}칸`).join(' · ')}`, warn: false };
  return { text: '영어·일본어도 한국어에 맞췄습니다.', warn: false };
}
