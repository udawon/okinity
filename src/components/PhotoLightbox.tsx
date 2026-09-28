'use client';

import { useCallback, useEffect, useRef } from 'react';
import { swipeStep } from '@/lib/photo-fit';

export type LightboxPhoto = { src: string; alt: string };

/**
 * 사진 크게 보기(라이트박스) — 투어 갤러리·블로그 공용. 열린 순번은 부모가 관리(controlled).
 * Esc 닫기 · ←/→ 넘기기 · 휴대폰 좌우 스와이프 · 배경 클릭 닫기 · 열리는 동안 페이지 스크롤 잠금 ·
 * 닫으면 여는 버튼으로 포커스 복귀.
 * 사진은 가로·세로 모두 비율을 유지한 채 화면 안에 다 들어오게 줄인다(스크롤이 잠겨 있어 넘치면 볼 방법이 없다).
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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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
    'absolute grid h-12 w-12 place-items-center rounded-full text-2xl text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';
  // 휴대폰에서는 넘김 버튼이 사진 위에 겹치므로 밝은 사진에서도 보이게 어둡게 깐다
  const navBtn = `${btn} bg-black/40 sm:bg-white/10`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.dialog}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#02101e]/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        // 두 손가락(확대 제스처)은 넘김으로 보지 않는다
        touchStart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        // 화면을 확대한 상태에서는 한 손가락 이동이 사진 둘러보기라 넘기지 않는다
        if (!start || count < 2 || (window.visualViewport?.scale ?? 1) > 1.01) return;
        const end = e.changedTouches[0];
        const step = swipeStep(end.clientX - start.x, end.clientY - start.y);
        if (step) go(step);
      }}
    >
      {/*
        사진 최대 크기 = 화면 - 여백. 위·아래 4rem 은 닫기 버튼·번호 자리, 좌우는 PC 에서 넘김 버튼 자리.
        화면 단위(vw/dvh)로 직접 제한해야 가로·세로 사진 모두 비율을 유지한 채 화면 안에 들어온다
        (grid 칸 기준 % 는 칸이 사진 크기만큼 늘어나 제한이 걸리지 않는다 — 이전 버그의 원인).
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        draggable={false}
        className="max-h-[calc(100vh-8rem)] max-w-[calc(100vw-1.5rem)] select-none rounded-lg object-contain supports-[height:100dvh]:max-h-[calc(100dvh-8rem)] sm:max-w-[calc(100vw-12rem)]"
      />
      <button ref={closeRef} type="button" onClick={onClose} aria-label={labels.close} className={`${btn} right-4 top-4 bg-white/10`}>
        ×
      </button>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className={`${navBtn} left-3 top-1/2 -translate-y-1/2 sm:left-6`}>
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label={labels.next} className={`${navBtn} right-3 top-1/2 -translate-y-1/2 sm:right-6`}>
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
