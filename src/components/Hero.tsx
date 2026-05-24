import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/** Hero 어드민 오버라이드 — 비어있는 필드는 번역 기본값을 사용. */
export type HeroOverride = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
};

/** 첫 화면 — Siyam 톤. 풀블리드 배경(이미지/동영상) + 중앙 정렬 오버레이. */
export default async function Hero({ override }: { override?: HeroOverride } = {}) {
  const t = await getTranslations('hero');
  const trust = [t('trust1'), t('trust2'), t('trust3')];

  const eyebrow = override?.eyebrow?.trim() || t('eyebrow');
  const title = override?.title?.trim() || t('title');
  const subtitle = override?.subtitle?.trim() || t('subtitle');
  const mediaUrl = override?.mediaUrl?.trim() || '/images/hero-placeholder.svg';
  const isVideo = override?.mediaType === 'video';

  return (
    <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden">
      {/* 배경 — 동영상(자동재생 무음 루프) 또는 이미지 */}
      {isVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
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
          className="absolute inset-0 bg-brand-light bg-cover bg-center"
          style={{ backgroundImage: `url(${mediaUrl})` }}
          aria-hidden
        />
      )}
      {/* 가독성용 그라데이션 오버레이 */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center text-white">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-white/85">
          {eyebrow}
        </span>
        <h1 className="mt-5 break-keep font-serif text-4xl font-normal leading-[1.12] drop-shadow sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl break-keep text-base leading-relaxed text-white/90 sm:text-lg">
          {subtitle}
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-button bg-brand px-7 py-3.5 text-sm font-semibold text-brand-contrast shadow-card transition-colors hover:bg-brand-dark"
          >
            {t('cta')}
          </Link>
          <Link
            href="/diving"
            className="rounded-button border border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t('ctaSecondary')}
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.12em] text-white/80">
          {trust.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
