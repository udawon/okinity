'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { syncTranslationItem } from '@/app/admin/translation-actions';

export type TranslationStatusItem = { key: string; label: string; en: number; ja: number };

/**
 * 번역 상태 + "번역 맞추기" — 한국어보다 오래된 영어·일본어 번역을 한국어 기준으로 다시 번역한다.
 * 항목마다 서버액션을 한 번씩 순서대로 불러 진행 상황을 보여준다(한 요청 = 콘텐츠 하나).
 */
export default function TranslationSyncPanel({
  items,
  enabled
}: {
  items: TranslationStatusItem[];
  enabled: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ text: string; failed: string[] } | null>(null);

  const stale = items.filter((i) => i.en + i.ja > 0);
  const en = stale.reduce((n, i) => n + i.en, 0);
  const ja = stale.reduce((n, i) => n + i.ja, 0);

  async function run() {
    setResult(null);
    setProgress({ done: 0, total: stale.length });
    const failed: string[] = [];
    let translated = 0;
    for (const [i, item] of stale.entries()) {
      setRunning(item.label);
      try {
        const res = await syncTranslationItem(item.key);
        const left = res.sync?.langs.reduce((n, l) => n + l.left, 0) ?? 0;
        translated += res.sync?.langs.reduce((n, l) => n + l.translated, 0) ?? 0;
        if (res.error || left > 0) failed.push(item.label);
      } catch {
        failed.push(item.label); // 세션 만료·네트워크 — 다음 항목은 계속
      }
      setProgress({ done: i + 1, total: stale.length });
    }
    setRunning(null);
    setResult({ text: `${stale.length - failed.length}개 완료 · ${translated}칸 번역`, failed });
    router.refresh();
  }

  return (
    <section className="mb-6 rounded-card border border-line bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">영어·일본어 번역 상태</h2>
          <p className="mt-1 text-muted">
            {stale.length
              ? `한국어보다 오래된 번역: 콘텐츠 ${stale.length}개 (영어 ${en}칸 · 일본어 ${ja}칸)`
              : '모든 번역이 한국어와 맞습니다.'}
          </p>
        </div>
        {stale.length > 0 && (
          <button
            type="button"
            onClick={run}
            disabled={!enabled || running !== null}
            className="rounded-button bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
          >
            {running ? `번역 중… ${progress.done}/${progress.total}` : `번역 맞추기 (${stale.length}개)`}
          </button>
        )}
      </div>
      {!enabled && stale.length > 0 && (
        <p className="mt-2 text-xs text-amber-700">자동 번역이 꺼져 있습니다(번역 API 키 미설정). 키를 등록하면 사용할 수 있어요.</p>
      )}
      {running && (
        <p className="mt-2 text-xs text-muted" role="status" aria-live="polite">
          {running} 번역 중… 콘텐츠 하나에 최대 1분 걸릴 수 있어요. 이 화면을 닫지 마세요.
        </p>
      )}
      {result && (
        <p className={`mt-2 text-xs ${result.failed.length ? 'text-amber-700' : 'text-emerald-600'}`} role="status">
          {result.text}
          {result.failed.length > 0 && ` · 일부 실패: ${result.failed.join(', ')} — 다시 누르면 남은 칸만 번역합니다.`}
        </p>
      )}
      {stale.length > 0 && (
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">번역이 필요한 콘텐츠 보기</summary>
          <ul className="mt-2 space-y-1">
            {stale.map((i) => (
              <li key={i.key}>
                {i.label} — 영어 {i.en}칸 · 일본어 {i.ja}칸
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
