'use client';

import { useState } from 'react';
import { cdnMedia } from '@/lib/media';
import type { BlogGroup, BlogPhoto } from '@/lib/blog';
import MediaFigure from '@/components/MediaFigure';
import PhotoLightbox from '@/components/PhotoLightbox';

/**
 * 블로그 본문 — 연속 사진은 그리드로 묶고(첫 장 크게), 누르면 글 전체 사진을 크게 넘겨본다.
 * 글·영상·설명 달린 사진은 원래 순서대로. (블로그는 한국어 전용 — 문구는 한국어 고정)
 */
export default function BlogBody({ groups, title }: { groups: BlogGroup[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const all = groups
    .flatMap((g) => (g.kind === 'photos' ? g.photos : g.kind === 'figure' ? [{ url: g.url, index: g.index }] : []))
    .sort((a, b) => a.index - b.index);
  const lightboxPhotos = all.map((p) => ({ src: cdnMedia(p.url), alt: `${title} 사진 ${p.index + 1}` }));
  // 라이트박스 순번 = all 배열 위치(사진 index 와 같지만 빈 사진 제외로 어긋날 수 있어 위치로 찾는다)
  const openPhoto = (p: BlogPhoto) => setOpen(all.findIndex((x) => x.index === p.index));

  const thumb = (p: BlogPhoto, className: string, eager = false) => (
    <button
      key={p.index}
      type="button"
      onClick={() => openPhoto(p)}
      aria-label={`사진 ${p.index + 1} 크게 보기`}
      className={`group overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cdnMedia(p.url)}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </button>
  );

  return (
    <div className="mt-8 space-y-5">
      {groups.map((g, i) => {
        if (g.kind === 'text') {
          return (
            <p key={i} className="whitespace-pre-wrap text-base leading-[1.85] text-white/85">
              {g.value}
            </p>
          );
        }
        if (g.kind === 'video') {
          return <MediaFigure key={i} type="video" url={g.url} poster={g.poster} caption={g.caption} />;
        }
        if (g.kind === 'figure') {
          return (
            <figure key={i} className="overflow-hidden rounded-card border border-white/10">
              {thumb({ url: g.url, index: g.index }, 'block w-full rounded-none')}
              <figcaption className="bg-black/20 px-4 py-2 text-center text-sm text-white/60">{g.caption}</figcaption>
            </figure>
          );
        }
        const n = g.photos.length;
        if (n === 1) return <div key={i}>{thumb(g.photos[0], 'block aspect-[4/3] w-full', i === 0)}</div>;
        if (n === 2) {
          return (
            <div key={i} className="grid grid-cols-2 gap-2">
              {g.photos.map((p, j) => thumb(p, 'aspect-[4/5]', i === 0 && j === 0))}
            </div>
          );
        }
        return (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {g.photos.map((p, j) =>
              thumb(
                p,
                j === 0 ? 'col-span-2 aspect-[4/3] sm:row-span-2 sm:aspect-auto' : 'aspect-square',
                i === 0 && j === 0
              )
            )}
          </div>
        );
      })}

      <PhotoLightbox
        photos={lightboxPhotos}
        index={open}
        onChange={setOpen}
        onClose={() => setOpen(null)}
        labels={{ dialog: '사진 크게 보기', close: '닫기', prev: '이전 사진', next: '다음 사진' }}
      />
    </div>
  );
}
