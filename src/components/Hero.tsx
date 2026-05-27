import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
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
 * 첫 화면 — 시네마틱 몰입형(trickyknot 톤).
 * 수면 위 풀스크린 + 중앙 대형 타이포 + DIVE DEEPER 인디케이터.
 * 배경 영상이 없으면 OceanBackground(수면 청록)가 그대로 비친다.
 */
export default async function Hero({ override }: { override?: HeroOverride } = {}) {
  const t = await getTranslations('hero');
  const trust = [t('trust1'), t('trust2'), t('trust3')];

  const eyebrow = override?.eyebrow?.trim() || t('eyebrow');
  const title = override?.title?.trim() || t('title');
  const subtitle = override?.subtitle?.trim() || t('subtitle');
  const mediaUrl = override?.mediaUrl?.trim();
  const isVideo = override?.mediaType === 'video';

  return (
    <section className="relative flex h-[100svh] min-h-[620px] w-full items-center justify-center overflow-hidden">
      {/* 배경 영상/이미지 (있을 때만 — 없으면 OceanBackground 수면색이 비침) */}
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

      {/* 중앙 콘텐츠 */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <span className="block text-[0.72rem] font-medium uppercase tracking-[0.4em] text-white/80">
          {eyebrow}
        </span>
        <RevealWords
          as="h1"
          text={title}
          className="mx-auto mt-6 max-w-[20ch] break-keep font-sans text-[2.5rem] font-semibold leading-[1.08] drop-shadow-[0_2px_24px_rgba(0,0,0,0.4)] sm:text-6xl lg:text-7xl"
        />
        <p className="mx-auto mt-6 max-w-xl break-keep text-base leading-relaxed text-white/80 sm:text-lg">
          {subtitle}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#06151d] transition hover:bg-white/90"
          >
            {t('cta')}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/diving"
            className="text-sm font-medium text-white/85 underline-offset-4 transition hover:text-white hover:underline"
          >
            {t('ctaSecondary')}
          </Link>
        </div>

        <ul className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.16em] text-white/55">
          {trust.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {/* DIVE DEEPER 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <span className="block text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/70">
          Dive Deeper
        </span>
        <span className="mx-auto mt-3 block h-9 w-px animate-pulse bg-white/40" aria-hidden />
      </div>
    </section>
  );
}
