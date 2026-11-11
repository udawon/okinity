'use client';

import { useEffect, useRef, useState } from 'react';
import { cdnMedia } from '@/lib/media';
import type { BlogPhoto } from '@/lib/blog';

/**
 * 블로그 연속 사진 — 한 장씩 위에서 아래로 나열(가장 단순한 방식). 누르면 크게 보기(onOpen).
 * - 가로 사진은 본문 폭 가득, 세로 사진은 화면 높이의 80%까지만 커지고 가운데 정렬(잘림 없음).
 * - 설명은 각 사진 바로 아래.
 */
export default function BlogPhotoList({
  photos,
  title,
  eagerIndex,
  onOpen
}: {
  photos: BlogPhoto[];
  /** 대체 텍스트용 글 제목(설명이 없는 사진). */
  title: string;
  /** 바로 불러올 사진 번호(글의 첫 사진). 나머지는 스크롤해서 가까워질 때 불러온다. */
  eagerIndex?: number;
  onOpen: (p: BlogPhoto) => void;
}) {
  return (
    <div className="space-y-3">
      {photos.map((p) => (
        <BlogPhotoItem key={p.index} photo={p} title={title} eager={p.index === eagerIndex} onOpen={onOpen} />
      ))}
    </div>
  );
}

function BlogPhotoItem({
  photo,
  title,
  eager,
  onOpen
}: {
  photo: BlogPhoto;
  title: string;
  eager: boolean;
  onOpen: (p: BlogPhoto) => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  // 불러오기 전에는 4:3 자리를 잡아 둔다 — 높이 0 인 사진들이 한꺼번에 화면 안으로 잡혀
  // 스크롤 전에 전부 내려받는 것(지연 로딩 무력화)과 글이 덜컹거리는 것을 막는다.
  const [loaded, setLoaded] = useState(false);
  // 서버에서 그린 사진은 화면 준비(hydration) 전에 이미 로드돼 onLoad 를 놓칠 수 있다 → 마운트 때 한 번 확인
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <figure className={photo.caption ? 'pb-3' : undefined}>
      <button
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`사진 ${photo.index + 1} 크게 보기`}
        className={`cursor-zoom-in rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fc6ef] ${
          loaded ? 'mx-auto block w-fit max-w-full' : 'block w-full'
        }`}
      >
        {/* 원격(Supabase) 이미지 — next/image 도메인 설정 회피 위해 img 사용 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ref}
          src={cdnMedia(photo.url)}
          alt={photo.caption || `${title} 사진 ${photo.index + 1}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={
            loaded
              ? 'block h-auto max-h-[80svh] w-auto max-w-full rounded-card'
              : 'block aspect-[4/3] w-full rounded-card bg-white/[0.04]'
          }
        />
      </button>
      {photo.caption && (
        <figcaption className="mt-2 text-center text-sm leading-relaxed text-white/60">{photo.caption}</figcaption>
      )}
    </figure>
  );
}
