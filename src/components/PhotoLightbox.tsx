'use client';

import { useCallback, useEffect, useRef } from 'react';

export type LightboxPhoto = { src: string; alt: string };

/**
 * 사진 크게 보기(라이트박스) — 투어 갤러리·블로그 공용. 열린 순번은 부모가 관리(controlled).
 * Esc 닫기 · ←/→ 넘기기 · 배경 클릭 닫기 · 열리는 동안 페이지 스크롤 잠금 · 닫으면 여는 버튼으로 포커스 복귀.
 */
export default function PhotoLightbox({
  photos,
  index,
  onChange,
  onClose,
  labels
}: {
  photos: LightboxPhoto[];
  /** 열린 사진 순번. null 이면 닫힘. */
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
  labels: { dialog: string; close: string; prev: string; next: string };
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const open = index !== null && photos.length > 0;
  const count = photos.length;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onChange((index + delta + count) % count);
    },
    [index, count, onChange]
  );

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus();
    };
    // 열림/닫힘 전환 때만 포커스·스크롤 잠금을 건다(사진 넘김마다 재실행하지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    // 넘김은 최신 index 를 쓰도록 go 가 바뀔 때마다 다시 건다
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, go]);

  if (!open) return null;
  const photo = photos[index!];
  const btn =
    'absolute grid h-12 w-12 place-items-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.dialog}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#02101e]/95 p-4 sm:p-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt={photo.alt} className="max-h-full max-w-full rounded-lg object-contain" />
      <button ref={closeRef} type="button" onClick={onClose} aria-label={labels.close} className={`${btn} right-4 top-4`}>
        ×
      </button>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className={`${btn} left-3 top-1/2 -translate-y-1/2 sm:left-6`}>
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label={labels.next} className={`${btn} right-3 top-1/2 -translate-y-1/2 sm:right-6`}>
            ›
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
            {index! + 1} / {count}
          </div>
        </>
      )}
    </div>
  );
}
