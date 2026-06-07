'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

type Group = { title: string; items: string[] };

export default function MedicalCheckModal({
  onCancel,
  onConfirm,
  submitting
}: {
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const t = useTranslations('medical');
  // 안전 체크리스트 — 6개 그룹(번역 카탈로그). 펼쳐 읽고 그룹 단위로 '해당 없음' 확인.
  const GROUPS = t.raw('groups') as Group[];
  const TOTAL = GROUPS.length;

  // 모달을 document.body로 포털 — 예약 폼 패널의 backdrop-blur(backdrop-filter)가
  // position:fixed의 기준(containing block)을 패널로 바꿔, 포털 없이는 모달이 폼 칼럼에
  // 갇혀 화면을 덮지 못한다. 마운트 후에만 포털(SSR 안전).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 한 번에 하나만 열림(다른 영역은 자동으로 닫혀 집중 유도).
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  const toggleOpen = (i: number) => setOpenIndex((cur) => (cur === i ? null : i));

  // '해당 없음' 체크 시: 그룹을 확인 처리하고, 현재 아코디언을 닫은 뒤 다음 미확인 그룹을
  // 자동으로 펼친다(자연스러운 순차 진행). 체크 해제 시에는 전진하지 않고 펼침을 유지(수정 의도).
  const toggleConfirm = (i: number) => {
    const checking = !confirmed.has(i);
    const next = new Set(confirmed);
    checking ? next.add(i) : next.delete(i);
    setConfirmed(next);
    if (!checking) return;
    // i 이후의 미확인 그룹을 우선 탐색, 없으면 처음부터 i 이전까지 탐색. 모두 확인됐으면 닫음(null).
    let target: number | null = null;
    for (let k = i + 1; k < TOTAL; k++) if (!next.has(k)) { target = k; break; }
    if (target === null) for (let k = 0; k < i; k++) if (!next.has(k)) { target = k; break; }
    setOpenIndex(target);
  };

  const allConfirmed = confirmed.size === TOTAL;
  const pct = Math.round((confirmed.size / TOTAL) * 100);
  const bold = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> };

  const modal = (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-y-auto bg-black/60 sm:items-center sm:p-4">
      <div className="flex h-dvh w-full max-w-lg flex-col border-white/10 bg-[#061522] sm:h-auto sm:max-h-[90vh] sm:rounded-card sm:border">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5fc6ef]">
              Safety Check
            </p>
            <h2 className="font-serif text-xl text-white">{t('title')}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t('close')}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 본문(스크롤) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-card border border-amber-300/30 bg-amber-400/10 p-4 text-[13px] leading-relaxed text-amber-100/90">
            <p>{t.rich('intro1', bold)}</p>
            <p className="mt-2">{t.rich('intro2', bold)}</p>
            <p className="mt-2 text-amber-200/80">{t.rich('intro3', bold)}</p>
          </div>

          <div className="mt-4 space-y-2">
            {GROUPS.map((g, gi) => {
              const open = openIndex === gi;
              const conf = confirmed.has(gi);
              return (
                <div
                  key={gi}
                  className={`overflow-hidden rounded-lg border ${
                    conf ? 'border-[#5fc6ef]/40' : 'border-white/10'
                  }`}
                >
                  {/* 아코디언 헤더 */}
                  <button
                    type="button"
                    onClick={() => toggleOpen(gi)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.05]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                          conf ? 'bg-[#5fc6ef] text-[#06202f]' : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {conf ? '✓' : gi + 1}
                      </span>
                      <span className="text-sm font-semibold text-white">{g.title}</span>
                      <span className="text-[11px] text-white/40">
                        {t('itemsCount', { count: g.items.length })}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {conf && (
                        <span className="rounded-full bg-[#5fc6ef]/15 px-2 py-0.5 text-[11px] font-medium text-[#5fc6ef]">
                          {t('confirmed')}
                        </span>
                      )}
                      <span
                        className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                      >
                        ⌄
                      </span>
                    </span>
                  </button>

                  {/* 아코디언 본문 — 펼쳤을 때만 항목·체크박스 노출(접힌 상태에선 체크 불가) */}
                  {open && (
                    <div className="border-t border-white/10 px-4 py-3">
                      <ul className="space-y-2 text-[13px] leading-relaxed text-white/80">
                        {g.items.map((it, ii) => (
                          <li key={ii} className="flex gap-2">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => toggleConfirm(gi)}
                        aria-pressed={conf}
                        className={`mt-3 flex w-full items-center gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                          conf
                            ? 'border-[#5fc6ef]/50 bg-[#5fc6ef]/10'
                            : 'border-white/15 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[12px] font-bold ${
                            conf ? 'bg-[#5fc6ef] text-[#06202f]' : 'border border-white/30 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="text-sm font-medium text-white">{t('noneApply')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터(고정) */}
        <div className="border-t border-white/10 px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-white/60">
              {t('progress', { done: confirmed.size, total: TOTAL })}
            </span>
            {!allConfirmed && <span className="text-amber-300">{t('progressHint')}</span>}
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#5fc6ef] transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/20 px-4 py-3 text-sm text-white/70 hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!allConfirmed || submitting}
              className="flex-1 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300 disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modal, document.body) : null;
}
