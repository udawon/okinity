import { cdnMedia } from '@/lib/media';

/**
 * 공개 페이지용 사진·영상 표시(블로그 본문 / 공지 첨부 공용).
 *
 * 방문자 전송량 원칙:
 *  · 영상은 `preload="none"` — 페이지에 들어와도 영상 바이트는 0. 재생 버튼을 눌러야 내려받는다.
 *  · 포스터(첫 프레임 WebP, 업로드 시 자동 생성)만 미리 보이고, 그 포스터도 lazy 로드된다.
 *  · 이미지는 `loading="lazy"` — 화면 밖 이미지는 스크롤 전까지 요청하지 않는다.
 *  · 영상 src 는 cdnMedia 가 원본(Supabase) URL 을 유지한다 — Range(206) 지원이 필요하기 때문.
 */
export default function MediaFigure({
  type,
  url,
  poster,
  caption
}: {
  type: 'image' | 'video';
  url: string;
  poster?: string;
  caption?: string;
}) {
  if (!url) return null;
  const posterSrc = poster ? cdnMedia(poster) : undefined;

  return (
    <figure className="overflow-hidden rounded-card border border-white/10">
      {type === 'video' ? (
        <video
          src={cdnMedia(url)}
          poster={posterSrc}
          controls
          playsInline
          preload="none"
          className="w-full bg-black object-contain"
          // 포스터가 없으면 로드 전 높이가 무너지므로 16:9 로 자리를 잡아 둔다(레이아웃 이동 방지).
          style={posterSrc ? { maxHeight: '75vh' } : { aspectRatio: '16 / 9' }}
        />
      ) : (
        // 원격(Supabase) 이미지 — next/image 도메인 설정 회피 위해 img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cdnMedia(url)}
          alt={caption || ''}
          loading="lazy"
          decoding="async"
          className="w-full"
        />
      )}
      {caption && (
        <figcaption className="bg-black/20 px-4 py-2 text-center text-sm text-white/55">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
