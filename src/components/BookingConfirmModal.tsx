'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';

/**
 * 가예약 확인 팝업 — 예약 문의를 실제로 보내기 직전의 마지막 단계.
 * "현재 예약은 가예약이며 카카오톡·메일 상담 후 확정" 안내를 강조하고, 입력 내용 요약으로 오입력을 한 번 더 잡는다.
 * - [확인하고 보내기]를 눌러야 전송된다. 실패하면 팝업을 닫지 않고 그 안에 오류를 보여 바로 다시 누를 수 있다.
 * - [수정하기]·✕·Esc 는 폼으로 돌아간다(보내는 중에는 막음).
 * - document.body 로 포털 — 예약 패널의 backdrop-blur 가 fixed 기준을 패널로 바꿔 화면을 못 덮는 문제(MedicalCheckModal 과 동일).
 */
export default function BookingConfirmModal({
  rows,
  submitting,
  error,
  onEdit,
  onConfirm
}: {
  /** 손님 언어로 만든 요약 줄(라벨·값). */
  rows: { label: string; value: string }[];
  submitting: boolean;
  /** 전송 실패 안내(없으면 null). */
  error: ReactNode | null;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('reservation');
  const panelRef = useRef<HTMLDivElement>(null);
  // Esc 처리에서 최신 값을 쓰도록 ref 로 보관(열려 있는 동안 리스너를 다시 걸지 않기 위해)
  const latest = useRef({ submitting, onEdit });
  latest.current = { submitting, onEdit };

  // 이 팝업은 손님이 보내기를 누른 뒤에만(브라우저에서만) 그려지므로 서버 렌더 대비(mounted 확인)가 필요 없다 —
  // 바로 포털로 그려, 열리자마자 누른 Esc 도 놓치지 않는다.
  useEffect(() => {
    const lastFocus = document.activeElement as HTMLElement | null;
    // 보내기 버튼이 아니라 팝업 자체에 포커스 — Enter 연타로 안내를 읽지 않고 보내지 않게
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !latest.current.submitting) latest.current.onEdit();
      if (e.key === 'Tab') trapFocus(e);
    };
    // Tab 이 팝업 밖(어둡게 덮인 뒤쪽 폼)으로 나가지 않게 팝업 안 버튼끼리만 돈다
    const trapFocus = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled])')];
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (e.shiftKey && (!inside || active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/65 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirm-title"
        aria-describedby="booking-confirm-notice"
        tabIndex={-1}
        className="my-auto w-full max-w-md rounded-card border border-white/10 bg-[#061522] shadow-[0_24px_70px_rgba(0,0,0,0.55)] focus:outline-none"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5fc6ef]">Tentative Booking</p>
            <h2 id="booking-confirm-title" className="mt-0.5 font-serif text-xl text-white">
              {t('confirmTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onEdit}
            disabled={submitting}
            aria-label={t('confirmClose')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-white/60 hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          {/* 가예약 안내 — 이 팝업의 핵심 메시지라 가장 먼저, 가장 눈에 띄게 */}
          <div
            id="booking-confirm-notice"
            className="flex gap-3 rounded-card border border-amber-300/45 bg-amber-400/15 p-4"
          >
            <span
              aria-hidden
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-sm font-bold text-[#06202f]"
            >
              !
            </span>
            <p className="text-[15px] font-semibold leading-relaxed text-amber-50">{t('confirmNotice')}</p>
          </div>

          {/* 입력 내용 요약 */}
          {rows.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{t('confirmSummary')}</p>
              <dl className="mt-2 divide-y divide-white/[0.07] rounded-lg border border-white/10 bg-white/[0.03]">
                {rows.map((r) => (
                  <div key={r.label} className="flex gap-3 px-3.5 py-2.5 text-sm">
                    <dt className="w-[5.5rem] shrink-0 text-white/50">{r.label}</dt>
                    {/* 긴 이메일·ID 도 팝업 밖으로 넘치지 않게 아무 데서나 줄바꿈 */}
                    <dd className="min-w-0 flex-1 text-white [overflow-wrap:anywhere]">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-button bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onEdit}
            disabled={submitting}
            className="rounded-full border border-white/20 px-4 py-3 text-sm text-white/75 hover:text-white disabled:opacity-40"
          >
            {t('confirmEdit')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-colors hover:bg-amber-300 disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? t('submitting') : t('confirmSend')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
