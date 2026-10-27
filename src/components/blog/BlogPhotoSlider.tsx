'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cdnMedia } from '@/lib/media';
import { isPortrait } from '@/lib/photo-fit';
import { nearestSlide, slideDepth, slideOffset, stepSlide } from '@/lib/photo-slider';
import type { BlogPhoto } from '@/lib/blog';

/**
 * 블로그 사진 슬라이드 — 큰 사진을 좌우로 넘겨 본다(한 장이면 큰 사진 1장).
 * - 넘기기: 브라우저 기본 가로 스크롤 + 스냅(손가락·트랙패드 관성 그대로), 화살표·키보드 ←→.
 * - 깊이감: 옆 슬라이드는 작고 어둡게, 안쪽 사진은 반대로 흐른다(lib/photo-slider).
 *   스크롤 프레임마다 React 렌더 없이 CSS 변수만 바꾼다. 움직임 줄이기 설정이면 효과를 끈다.
 * - 세로 사진은 잘리지 않게 전체를 보이고, 빈 곳은 같은 사진을 흐리게 깐다.
 * - 사진을 누르면 크게 보기(onOpen). 설명은 현재 사진 것만 아래에 보인다.
 */
/** 가로 스크롤 영역 양끝 페이드 — 그림자는 스크롤 영역에 잘려 띠가 생기므로 슬라이드엔 쓰지 않는다. */
const EDGE_FADE = 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)';

export default function BlogPhotoSlider({
  photos,
  onOpen,
  eager = false
}: {
  photos: BlogPhoto[];
  onOpen: (p: BlogPhoto) => void;
  eager?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const count = photos.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const offsets = slideRefs.current.slice(0, count).map((el) =>
        el ? slideOffset(el.offsetLeft, el.offsetWidth, track.scrollLeft, track.clientWidth) : Infinity
      );
      offsets.forEach((o, i) => {
        const el = slideRefs.current[i];
        if (!el) return;
        const { shift, scale, dim } = slideDepth(o, motion);
        el.style.setProperty('--shift', `${shift}%`);
        el.style.setProperty('--scale', String(scale));
        el.style.setProperty('--dim', String(dim));
        // 옆 슬라이드는 가운데 쪽 가장자리를 기준으로 줄어든다 — 화면 끝에 살짝 보이는 다음 사진이 밀려나지 않게
        el.style.transformOrigin = o > 0 ? '0% 50%' : o < 0 ? '100% 50%' : '50% 50%';
      });
      setActive(nearestSlide(offsets));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      track.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [count]);

  if (count === 0) return null;

  if (count === 1) {
    const p = photos[0];
    return (
      <figure className="lg:-mx-16">
        <button
          type="button"
          onClick={() => onOpen(p)}
          aria-label={`사진 ${p.index + 1} 크게 보기`}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#04121f] shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:aspect-[3/2]"
        >
          <SlidePhoto src={cdnMedia(p.url)} eager={eager} />
        </button>
        {p.caption && <figcaption className="mt-3 text-center text-sm text-white/65">{p.caption}</figcaption>}
      </figure>
    );
  }

  const go = (i: number) => {
    const track = trackRef.current;
    const el = slideRefs.current[i];
    if (!track || !el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    go(stepSlide(active, e.key === 'ArrowRight' ? 1 : -1, count));
  };
  const caption = photos[active]?.caption ?? '';

  return (
    // 휴대폰은 화면 끝까지(사진을 크게 + 양옆에 다음 사진이 살짝 보이게), 데스크톱은 본문보다 조금 넓게
    <div className="-mx-5 sm:-mx-6 lg:-mx-16">
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKey}
        role="region"
        aria-roledescription="carousel"
        aria-label={`사진 ${count}장 — 좌우로 넘겨 보기`}
        className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain outline-none sm:gap-4"
        // 양끝을 부드럽게 흐려 옆 사진이 경계에서 칼같이 잘려 보이지 않게
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
      >
        {/* 양끝 여백 — 첫·마지막 사진도 가운데에 멈추게(슬라이드 84% + 간격 기준) */}
        <div aria-hidden className="shrink-0 basis-[calc(8%-0.75rem)] sm:basis-[calc(8%-1rem)]" />
        {photos.map((p, i) => (
          <div
            key={p.index}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            className="relative aspect-[4/3] shrink-0 basis-[84%] snap-center snap-always sm:aspect-[3/2]"
            style={{ transform: 'scale(var(--scale, 1))' }}
          >
            <button
              type="button"
              onClick={() => onOpen(p)}
              tabIndex={i === active ? 0 : -1}
              aria-label={`사진 ${p.index + 1} 크게 보기`}
              className="group absolute inset-0 overflow-hidden rounded-2xl bg-[#04121f]"
            >
              <SlidePhoto src={cdnMedia(p.url)} eager={eager && i === 0} parallax />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[#02101e]"
                style={{ opacity: 'var(--dim, 0)' }}
              />
            </button>
          </div>
        ))}
        <div aria-hidden className="shrink-0 basis-[calc(8%-0.75rem)] sm:basis-[calc(8%-1rem)]" />
      </div>

      {/* 진행 막대 · 설명 · 번호 · 화살표 — 가운데 사진 폭에 맞춘다 */}
      <div className="mx-[8%] mt-4">
        <div className="h-px w-full bg-white/15">
          <div
            className="h-px bg-[#5fc6ef] transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${((active + 1) / count) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <p key={active} className="slide-caption min-h-[1.25rem] text-sm leading-relaxed text-white/70">
            {caption}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-serif text-sm tabular-nums text-white/60" aria-live="polite">
              <span className="text-white">{String(active + 1).padStart(2, '0')}</span>
              <span className="mx-1.5 text-white/30">/</span>
              {String(count).padStart(2, '0')}
            </span>
            <div className="hidden gap-2 sm:flex">
              <SlideArrow dir={-1} disabled={active === 0} onClick={() => go(stepSlide(active, -1, count))} />
              <SlideArrow dir={1} disabled={active === count - 1} onClick={() => go(stepSlide(active, 1, count))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideArrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? '이전 사진' : '다음 사진'}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/50 hover:text-white disabled:opacity-30 disabled:hover:border-white/20"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * 슬라이드 사진 — 가로 사진은 칸을 채우고(패럴랙스 여유만큼 살짝 확대), 세로 사진은 전체를 보이며
 * 뒤에 같은 사진을 흐리게 깐다. parallax 면 부모 슬라이드의 --shift 만큼 반대로 흐른다.
 */
function SlidePhoto({ src, eager, parallax = false }: { src: string; eager: boolean; parallax?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [portrait, setPortrait] = useState(false);
  const check = (el: HTMLImageElement | null) => {
    if (el?.complete) setPortrait(isPortrait(el.naturalWidth, el.naturalHeight));
  };
  // 서버에서 그린 사진은 화면이 준비(hydration)되기 전에 이미 로드돼 onLoad 를 놓칠 수 있다 → 마운트 때 한 번 확인
  useEffect(() => check(ref.current), [src]);

  return (
    <>
      {portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={(e) => check(e.currentTarget)}
        className={`absolute inset-0 h-full w-full select-none ${portrait ? 'object-contain' : 'object-cover'}`}
        style={{
          transform: parallax
            ? `translateX(var(--shift, 0%)) scale(${portrait ? 1 : 1.12})`
            : undefined
        }}
      />
    </>
  );
}
