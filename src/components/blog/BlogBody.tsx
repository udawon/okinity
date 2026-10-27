'use client';

import { useState } from 'react';
import { cdnMedia } from '@/lib/media';
import type { BlogGroup, BlogPhoto } from '@/lib/blog';
import MediaFigure from '@/components/MediaFigure';
import PhotoLightbox from '@/components/PhotoLightbox';
import BlogPhotoSlider from './BlogPhotoSlider';

/**
 * 블로그 본문 — 연속 사진은 큰 사진 슬라이드로 묶고(BlogPhotoSlider), 누르면 글 전체 사진을 크게 넘겨본다.
 * 글·영상은 원래 순서대로. (블로그는 한국어 전용 — 문구는 한국어 고정)
 */
export default function BlogBody({ groups, title }: { groups: BlogGroup[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const all = groups.flatMap((g) => (g.kind === 'photos' ? g.photos : [])).sort((a, b) => a.index - b.index);
  const lightboxPhotos = all.map((p) => ({ src: cdnMedia(p.url), alt: p.caption || `${title} 사진 ${p.index + 1}` }));
  // 라이트박스 순번 = all 배열 위치(사진 index 와 같지만 빈 사진 제외로 어긋날 수 있어 위치로 찾는다)
  const openPhoto = (p: BlogPhoto) => setOpen(all.findIndex((x) => x.index === p.index));

  return (
    <div className="mt-8 space-y-8">
      {groups.map((g, i) => {
        if (g.kind === 'text') {
          return (
            <p key={i} className="user-text whitespace-pre-wrap text-base leading-[1.85] text-white/85">
              {g.value}
            </p>
          );
        }
        if (g.kind === 'video') {
          return <MediaFigure key={i} type="video" url={g.url} poster={g.poster} caption={g.caption} />;
        }
        return <BlogPhotoSlider key={i} photos={g.photos} onOpen={openPhoto} eager={i === 0} />;
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
