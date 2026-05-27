import { getTranslations } from 'next-intl/server';
import RevealWords from './RevealWords';

/** Hero 어드민 오버라이드 — 비어있는 필드는 번역 기본값을 사용. */
export type HeroOverride = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
};

/**
 * 첫 화면 — 심플 시네마틱(trickyknot 톤). 배경 영상 위에 텍스트 한 줄만.
 * 중앙 대형 serif 타이포 + 하단 중앙 DIVE DEEPER 인디케이터.
 * 배경 영상이 없으면 OceanBackground(수면 영상)가 그대로 비친다.
 */
export default async function Hero({ override }: { override?: HeroOverride } = {}) {
  const t = await getTranslations('hero');

  const title = override?.title?.trim() || t('title');
  const mediaUrl = override?.mediaUrl?.trim();
  const isVideo = override?.mediaType === 'video';

  return (
    <section className="relative flex h-[calc(100svh-64px)] min-h-[560px] w-full items-center justify-center overflow-hidden sm:h-[calc(100svh-111px)]">
      {/* 배경 영상/이미지 (있을 때만 — 없으면 OceanBackground 수면 영상이 비침) */}
      {mediaUrl &&
        (isVideo ? (
          <video
            className="absolute inset-0 h-full w-full scale-105 object-cover"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          >
            <source src={mediaUrl} />
          </video>
        ) : (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: `url(${mediaUrl})` }}
            aria-hidden
          />
        ))}

      {/* 중앙 콘텐츠 — 텍스트만 */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <RevealWords
          as="h1"
          text={title}
          className="mx-auto max-w-[16ch] break-keep font-serif text-[2.6rem] font-medium leading-[1.25] tracking-[-0.01em] drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] sm:text-6xl lg:text-7xl"
        />
      </div>

      {/* DIVE DEEPER 인디케이터 — 하단 중앙 (라벨 + 둥둥 뜨는 아래 화살표) */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
          Dive Deeper
        </span>
        <svg
          className="animate-float-down h-3.5 w-7 text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
          viewBox="0 0 28 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 3 L14 11 L25 3" />
        </svg>
      </div>
    </section>
  );
}
