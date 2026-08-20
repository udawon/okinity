'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStableReducedMotion } from '@/hooks/useStableReducedMotion';

/**
 * 투어 상세 사진 캐러셀 — CSS scroll-snap 기반 좌우 스와이프 + 도트 + (lg+) 화살표.
 * 5초 자동 넘김은 사용자가 개입(터치·휠·화살표·도트)하는 순간 영구 정지하고,
 * 모션 최소화 설정·백그라운드 탭에서는 동작하지 않는다(WCAG 2.2.2).
 * 사진이 1장이면 부속 UI 전부 미노출 — 기존 단일 이미지와 동일하게 보인다.
 * 페이지 무게 방어: 첫 장만 즉시 로딩, 나머지는 lazy.
 */
export default function TourPhotoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations('tourDetail');
  const reduce = useStableReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false); // 사용자 개입 시 자동 넘김 영구 정지
  const many = images.length > 1;

  // 현재 슬라이드 인덱스 추적 — 스와이프·자동 넘김 공통(스크롤 위치가 단일 진실)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !many) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        setIndex(Math.min(Math.max(i, 0), images.length - 1));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [many, images.length]);

  // 사용자 개입 감지 — 트랙에서 직접 발생하는 이벤트만이 사용자 조작(자동 넘김의 scrollTo와 구분)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !many) return;
    const stop = () => setStopped(true);
    el.addEventListener('pointerdown', stop, { passive: true });
    el.addEventListener('wheel', stop, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('wheel', stop);
    };
  }, [many]);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    },
    [reduce]
  );

  const goToUser = (i: number) => {
    setStopped(true);
    goTo(i);
  };

  // 자동 넘김 — 5초 간격, 마지막 장에서 첫 장 복귀
  useEffect(() => {
    if (!many || stopped || reduce) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      goTo((index + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [many, stopped, reduce, index, images.length, goTo]);

  const arrowCls =
    'absolute top-1/2 z-10 hidden lg:grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#02101e]/60 text-white backdrop-blur-md transition-all duration-200 hover:border-white/50 hover:bg-[#02101e]/85 disabled:pointer-events-none disabled:opacity-0';

  return (
    <div className="relative mt-6 overflow-hidden rounded-card border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={alt}
        tabIndex={many ? 0 : undefined}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={many ? `${alt} (${i + 1}/${images.length})` : alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined}
            decoding="async"
            draggable={false}
            className="aspect-[16/9] w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {many && (
        <>
          {/* 도트 인디케이터 — 탭하면 해당 사진으로 이동 */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-2 backdrop-blur-sm">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToUser(i)}
                aria-label={t('goToPhoto', { num: i + 1 })}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* 화살표 — PC(lg+) 전용. 모바일·태블릿은 스와이프로 탐색 */}
          <button
            type="button"
            onClick={() => goToUser(Math.max(index - 1, 0))}
            disabled={index === 0}
            aria-label={t('prevPhoto')}
            className={`${arrowCls} left-3`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goToUser(Math.min(index + 1, images.length - 1))}
            disabled={index === images.length - 1}
            aria-label={t('nextPhoto')}
            className={`${arrowCls} right-3`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
