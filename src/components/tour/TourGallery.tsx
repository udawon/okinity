'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import PhotoLightbox from '@/components/PhotoLightbox';
import { isPortrait } from '@/lib/photo-fit';
import Icon from './icons';

/**
 * 투어 사진 — 장수에 맞춰 모양이 바뀐다.
 *   1장: 큰 사진 1장
 *   2장 이상: 모바일은 좌우 스와이프(번호 표시), 데스크톱은 모자이크(최대 5칸) + "모두 보기"
 * 어느 사진이든 누르면 크게 보기(라이트박스). 첫 장만 즉시 로딩, 나머지는 lazy.
 * 가로 사진은 칸을 꽉 채우고, 세로 사진은 잘리지 않게 전체를 보여준다(GalleryPhoto).
 */
export default function TourGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations('tourDetail');
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const photos = images.map((src, i) => ({ src, alt: count > 1 ? `${alt} ${i + 1}` : alt }));

  useEffect(() => {
    const el = trackRef.current;
    if (!el || count < 2) return;
    const onScroll = () => setSlide(Math.min(Math.round(el.scrollLeft / el.clientWidth), count - 1));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  if (!count) return null;

  const lightbox = (
    <PhotoLightbox
      photos={photos}
      index={open}
      onChange={setOpen}
      onClose={() => setOpen(null)}
      labels={{ dialog: t('galleryDialog'), close: t('galleryClose'), prev: t('prevPhoto'), next: t('nextPhoto') }}
    />
  );

  const img = (i: number) => <GalleryPhoto src={images[i]} alt={photos[i].alt} eager={i === 0} />;

  if (count === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="group mt-5 block w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
          aria-label={t('galleryOpen')}
        >
          <div className="h-[240px] sm:h-[380px] lg:h-[460px]">{img(0)}</div>
        </button>
        {lightbox}
      </>
    );
  }

  // 데스크톱 모자이크 칸 배치 — 첫 장은 크게(2×2), 나머지는 장수에 맞춰
  const cells = images.slice(0, 5);
  const cellClass = (i: number) => {
    if (i === 0 || count === 2) return 'col-span-2 row-span-2';
    if (count === 3) return 'col-span-2';
    if (count === 4) return i === 1 ? 'col-span-2' : '';
    return '';
  };

  return (
    <>
      {/* 모바일·태블릿: 좌우 스와이프 */}
      <div className="relative mt-5 lg:hidden">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              className="group aspect-[4/3] w-full shrink-0 snap-start overflow-hidden sm:aspect-[16/9]"
              aria-label={t('galleryOpenNth', { num: i + 1 })}
            >
              {img(i)}
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#061522]/75 px-2.5 py-1 text-xs font-bold text-white">
          {slide + 1} / {count}
        </span>
      </div>

      {/* 데스크톱: 모자이크 */}
      <div className="relative mt-5 hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl lg:grid">
        {cells.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className={`group overflow-hidden ${cellClass(i)}`}
            aria-label={t('galleryOpenNth', { num: i + 1 })}
          >
            {img(i)}
          </button>
        ))}
        {count > 2 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full border border-white/30 bg-[#061522]/80 px-4 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-[#061522]"
          >
            <Icon name="grid" className="h-4 w-4" />
            {t('galleryAll', { count })}
          </button>
        )}
      </div>
      {lightbox}
    </>
  );
}

/**
 * 갤러리 칸 하나의 사진. 가로 사진은 칸을 꽉 채우고(가장자리가 조금 잘림), 세로 사진은 칸에 맞춰
 * 자르면 가운데 띠만 남으므로 전체를 보여주고 빈 좌우는 같은 사진을 흐리게 깔아 채운다
 * (같은 주소라 추가 다운로드 없음). 방향은 사진이 로드된 뒤에야 알 수 있다.
 */
function GalleryPhoto({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [portrait, setPortrait] = useState(false);
  const check = (el: HTMLImageElement | null) => {
    if (el?.complete) setPortrait(isPortrait(el.naturalWidth, el.naturalHeight));
  };
  // 서버에서 그린 사진은 화면이 준비(hydration)되기 전에 이미 로드돼 onLoad 를 놓칠 수 있다 → 마운트 때 한 번 확인
  useEffect(() => check(ref.current), [src]);

  return (
    <span className="relative block h-full w-full overflow-hidden bg-[#061522]">
      {portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={(e) => check(e.currentTarget)}
        className={`relative h-full w-full transition-transform duration-300 group-hover:scale-[1.02] ${
          portrait ? 'object-contain' : 'object-cover'
        }`}
      />
    </span>
  );
}
