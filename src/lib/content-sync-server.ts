import 'server-only';
import {
  getSiteContentMap,
  setSiteContent,
  localizedContentKey,
  CONTENT_KEYS,
  type Json
} from './site-content';
import {
  SYNC_PATHS,
  buildLocalDoc,
  finalizeSync,
  manualEditSrc,
  planSync,
  staleCount,
  textEntries,
  type SyncKind,
  type SyncOutcome,
  type TextMap
} from './content-sync';
import { translateTexts, translationEnabled, type TranslateTarget } from './translate';
import { TOUR_CATALOG } from './tour';
import { TOUR_NOTICE_DEFAULTS, TOUR_NOTICE_IDS } from './tour-notices';

/**
 * 한국어 기준 번역 동기화(서버) — 한국어 저장 후 EN/JA 번역본을 다시 만들고 번역 기억을 남긴다.
 * 규칙은 순수 모듈 lib/content-sync, 설계는 docs/ai-discussions/20260929-한국어-기준-자동-번역.md.
 */

export const SYNC_LOCALES: TranslateTarget[] = ['en', 'ja'];

/** 번역 기억(원문 지도) 저장 키 — value: { src: { 경로: 번역할 때 쓴 한국어 원문 } }. */
export function translationMemoryKey(key: string, locale: string): string {
  return `translation:${key}:${locale}`;
}

export type SyncItem = { kind: SyncKind; key: string; label: string };

/** 한국어 기준으로 번역하는 콘텐츠 전체(어드민 "번역 맞추기" 대상). */
export function syncItems(): SyncItem[] {
  return [
    ...TOUR_CATALOG.map((t) => ({ kind: 'tour' as const, key: CONTENT_KEYS.tour(t.slug), label: t.name })),
    { kind: 'fishingClasses', key: CONTENT_KEYS.fishingClasses, label: '낚시 클래스(미들·럭셔리)' },
    { kind: 'tourNotices', key: CONTENT_KEYS.tourNotices, label: '투어 공통 안내(환불·안전)' },
    { kind: 'about', key: CONTENT_KEYS.about, label: '소개' },
    { kind: 'gallery', key: CONTENT_KEYS.gallery, label: '갤러리 사진 설명' }
  ];
}

export function syncItemFor(key: string): SyncItem | undefined {
  return syncItems().find((i) => i.key === key);
}

/** 상태·동기화에 필요한 키(한국어·번역본·번역 기억). */
export function syncKeys(key: string): string[] {
  return [key, ...SYNC_LOCALES.flatMap((l) => [localizedContentKey(key, l), translationMemoryKey(key, l)])];
}

function parseSrc(raw: unknown): TextMap {
  const src = raw && typeof raw === 'object' ? (raw as Json).src : null;
  if (!src || typeof src !== 'object') return {};
  return Object.fromEntries(Object.entries(src).filter(([, v]) => typeof v === 'string')) as TextMap;
}

/** 공통 안내 기본 문구는 사람이 다듬은 번역이 이미 있다 → 그 문구 그대로 쓰면 번역하지 않는다. */
function glossaryFor(kind: SyncKind, locale: TranslateTarget): TextMap {
  if (kind !== 'tourNotices') return {};
  const out: TextMap = {};
  for (const id of TOUR_NOTICE_IDS) {
    out[TOUR_NOTICE_DEFAULTS.ko[id].title] = TOUR_NOTICE_DEFAULTS[locale][id].title;
    out[TOUR_NOTICE_DEFAULTS.ko[id].body] = TOUR_NOTICE_DEFAULTS[locale][id].body;
  }
  return out;
}

/** 언어별 "번역이 한국어보다 오래된 칸" 수 — 한 번에 읽어 둔 map 에서 계산. 한국어 저장본이 없으면 0. */
export function staleByLocale(map: Record<string, unknown>, item: SyncItem): Record<TranslateTarget, number> {
  const koTexts = textEntries(map[item.key], SYNC_PATHS[item.kind]);
  const out = {} as Record<TranslateTarget, number>;
  for (const l of SYNC_LOCALES) out[l] = staleCount(koTexts, parseSrc(map[translationMemoryKey(item.key, l)]));
  return out;
}

/**
 * 한국어 저장본 기준으로 EN/JA 번역본을 다시 만든다. 한국어 저장 액션 뒤에 호출.
 * 바뀐 한국어 글만 번역하고, 사진·숫자·공개 여부·순서는 한국어 문서를 그대로 복제한다.
 * 번역 실패는 저장 실패가 아니다 — 이전 번역을 유지하고 "번역 필요"로 남긴다.
 */
export async function syncTranslations(item: Pick<SyncItem, 'kind' | 'key'>): Promise<SyncOutcome> {
  if (!translationEnabled()) return { enabled: false, langs: [] };
  try {
    return { enabled: true, langs: await runSync(item) };
  } catch (e) {
    return { enabled: true, langs: [], error: e instanceof Error ? e.message : '알 수 없는 오류' };
  }
}

async function runSync(item: Pick<SyncItem, 'kind' | 'key'>): Promise<SyncOutcome['langs']> {
  const map = await getSiteContentMap(syncKeys(item.key));
  const ko = map[item.key];
  if (!ko) return [];
  const paths = SYNC_PATHS[item.kind];
  const koTexts = textEntries(ko, paths);
  const deadline = Date.now() + 50_000; // 관리 페이지 maxDuration(60초) 안에서 끝낸다
  return Promise.all(
    SYNC_LOCALES.map(async (locale) => {
      const localKey = localizedContentKey(item.key, locale);
      const memoryKey = translationMemoryKey(item.key, locale);
      const prevLocal = textEntries(map[localKey], paths);
      const prevSrc = parseSrc(map[memoryKey]);
      const plan = planSync(koTexts, prevLocal, prevSrc, glossaryFor(item.kind, locale));
      const translated = Object.keys(plan.pending).length
        ? await translateTexts(plan.pending, locale, deadline)
        : {};
      const r = finalizeSync(koTexts, plan, translated, prevLocal, prevSrc);
      await setSiteContent(localKey, buildLocalDoc(ko, r.texts));
      await setSiteContent(memoryKey, { src: r.src });
      return { locale, translated: r.translated, left: r.left };
    })
  );
}

/**
 * EN/JA 탭에서 사람이 번역을 직접 고쳐 저장 — 번역본을 쓰고, 고친 칸을 "지금 한국어의 번역"으로
 * 기억해 다음 자동 번역이 덮어쓰지 않게 한다(그 칸의 한국어가 다시 바뀌기 전까지).
 */
export async function saveManualTranslation(
  item: Pick<SyncItem, 'kind' | 'key'>,
  locale: TranslateTarget,
  value: Json
): Promise<void> {
  const localKey = localizedContentKey(item.key, locale);
  const memoryKey = translationMemoryKey(item.key, locale);
  const map = await getSiteContentMap([item.key, localKey, memoryKey]);
  await setSiteContent(localKey, value);
  if (!map[item.key]) return;
  const paths = SYNC_PATHS[item.kind];
  const src = manualEditSrc(
    textEntries(map[item.key], paths),
    textEntries(map[localKey], paths),
    textEntries(value, paths),
    parseSrc(map[memoryKey])
  );
  await setSiteContent(memoryKey, { src });
}

/**
 * 언어별 콘텐츠 저장 — 한국어는 저장 뒤 EN/JA 를 한국어 기준으로 다시 번역하고(결과 반환),
 * EN/JA 는 사람이 고친 번역으로 기록한다(반환 없음). 어드민 저장 액션 공용.
 */
export async function saveLocalizedContent(
  item: Pick<SyncItem, 'kind' | 'key'>,
  lang: 'ko' | TranslateTarget,
  value: Json
): Promise<SyncOutcome | undefined> {
  if (lang !== 'ko') {
    await saveManualTranslation(item, lang, value);
    return undefined;
  }
  await setSiteContent(item.key, value);
  return syncTranslations(item);
}
