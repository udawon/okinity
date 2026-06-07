'use client';

import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useStableReducedMotion } from '@/hooks/useStableReducedMotion';
import { Link } from '@/i18n/routing';
import { TOUR_NAME_NAV_KEY } from '@/lib/tour';
import { type BlogPost } from '@/lib/blog';
import type {
  HomeTestimonials,
  HomeAssurances,
  HomeTourCopy,
  TourCardCopy
} from '@/lib/home-content';
import { type ScheduleItem } from '@/lib/content';
import BlogCard from '@/components/BlogCard';
import ReservePlanner from '@/components/ReservePlanner';
import {
  ACTIVITIES,
  ASSURANCES,
  TESTIMONIALS,
  GALLERY,
  HERO_DEFAULTS,
  type Activity
} from './ocean-home-data';

type ScheduleData = {
  items: ScheduleItem[];
  statusLabel: Record<ScheduleItem['status'], string>;
};

/* 길게 감속하는 시네마틱 ease-out(quint). 사이트 Reveal과 동일 톤. */
const EASE = [0.22, 1, 0.36, 1] as const;

/* ────────────────────────────────────────────────────────────
   아이콘 — 인라인 SVG (이모지 금지 규칙 준수, currentColor 상속)
   ──────────────────────────────────────────────────────────── */
type IconProps = { className?: string; style?: React.CSSProperties };
const ArrowRight = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Star = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2 2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2Z" />
  </svg>
);
const Shield = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Users = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2A3 3 0 0 1 16 12M16.5 14c2.5.3 4 2 4 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const Globe = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const Camera = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const ASSURANCE_ICONS = [Users, Shield, Globe, Camera];

/* 스크롤 진입 시 1회 페이드+상승 (Reveal 톤, 로컬판) */
function R({
  children,
  delay = 0,
  y = 28,
  className,
  style,
  as = 'div'
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'li' | 'h2' | 'p' | 'span';
}) {
  const reduce = useStableReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────
   시네마틱 배경 — 스크롤 깊이에 따라 수면→심해로 색이 가라앉음.
   고정(fixed) 레이어. 상속된 OceanBackground(-z-10) 위, 본문 아래.
   ──────────────────────────────────────────────────────────── */
function CinematicBackground() {
  const reduce = useStableReducedMotion();
  // 스크롤 진행도를 직접 계산(scrollY ÷ 최대스크롤, 0~1 clamp) → 단조 증가 보장.
  // (framer useScroll()이 본 레이아웃에서 비단조로 동작 — 최하단에서 progress가 0으로 되돌아가
  //  배경이 다시 밝아지는 버그가 있어, 신뢰 가능한 자체 계산으로 대체.)
  const progress = useMotionValue(0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce, progress]);

  // 깊이 단계별 레이어 — "쌓고 유지"(차오르면 0으로 빠지지 않음)해 위→아래 단조 하강.
  // 수면(밝음)이 사라지며 베이스(밝은 바다)가 드러나고, 그 위로 중층→심해가 차례로 덮어 점점 깊어진다.
  const surfaceOpacity = useTransform(progress, [0, 0.32], [1, 0]);
  const midOpacity = useTransform(progress, [0.18, 0.45], [0, 1]);
  const deepOpacity = useTransform(progress, [0.5, 0.92], [0, 1]);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: -5 }} aria-hidden>
      {/* 베이스(항상 깔리는 색 — 심해 대신 밝은 바다 틸) */}
      <div className="absolute inset-0 bg-[#0e5a90]" />
      {/* 수면 — 햇살 비치는 밝은 터콰이즈 */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: reduce ? 0.6 : surfaceOpacity,
          background:
            'radial-gradient(125% 85% at 50% -12%, #6fcef5 0%, #3aa6e0 28%, #1f86c2 50%, #1572b0 72%, #1065a0 100%)'
        }}
      />
      {/* 중층 — 맑은 청록 */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: reduce ? 0.55 : midOpacity,
          background:
            'radial-gradient(125% 95% at 50% 25%, #0d5688 0%, #0b4a78 42%, #093f62 72%, #083a58 100%)'
        }}
      />
      {/* 심해 — 깊고 어두운 청록(대비 확보) */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: reduce ? 0 : deepOpacity,
          background:
            'radial-gradient(100% 100% at 50% 60%, #093f62 0%, #07304a 55%, #052230 100%)'
        }}
      />
      {/* 코스틱(수면 굴절 무늬) */}
      <div
        className="ocean-caustics absolute inset-0 opacity-[0.10] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cg fill='none' stroke='%2389f0ff' stroke-width='1.2' stroke-opacity='0.6'%3E%3Cpath d='M0 60 Q55 20 110 60 T220 60'/%3E%3Cpath d='M0 120 Q55 80 110 120 T220 120'/%3E%3Cpath d='M0 180 Q55 140 110 180 T220 180'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '220px 220px'
        }}
      />
      {/* 비네팅(가장자리 살짝 — 청록 틴트로 완화, 시네마틱은 유지) */}
      <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_40%,transparent_58%,rgba(3,28,36,0.30)_100%)]" />
    </div>
  );
}

/* 떠오르는 입자(기포/플랑크톤) — 결정론적 배치(SSR-safe, Math.random 미사용) */
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const left = (i * 61.8) % 100; // 황금각 분산
  const size = 2 + ((i * 7) % 5);
  const dur = 7 + ((i * 3) % 7);
  const delay = (i % 9) * 0.7;
  const op = 0.18 + ((i % 4) * 0.12);
  const drift = (i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 4);
  return { left, size, dur, delay, op, drift, bottom: (i * 37) % 90 };
});
function Particles() {
  const reduce = useStableReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -4 }} aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="ocean-particle absolute rounded-full bg-cyan-100/80"
          style={
            {
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              width: p.size,
              height: p.size,
              ['--p-dur']: `${p.dur}s`,
              ['--p-delay']: `${p.delay}s`,
              ['--p-op']: p.op,
              ['--p-x']: `${p.drift}px`,
              boxShadow: '0 0 6px rgba(180,240,255,0.7)'
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* 섹션 사이 물결 디바이더 */
function WaveDivider({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <div className={`pointer-events-none -mb-px w-full overflow-hidden leading-[0] ${className}`} aria-hidden>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={`h-[60px] w-full ${flip ? 'rotate-180' : ''}`}
      >
        <path
          d="M0 40 C240 80 480 0 720 30 C960 60 1200 90 1440 40 L1440 80 L0 80 Z"
          fill="rgba(6,44,55,0.45)"
        />
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   HERO
   ──────────────────────────────────────────────────────────── */
function Hero({
  media,
  text,
  extra
}: {
  media?: { url?: string; type?: string };
  text?: { eyebrow?: string; title?: string; subtitle?: string };
  extra?: { badges?: string[]; ctaReserve?: string; ctaExplore?: string };
}) {
  const t = useTranslations('ocean');
  const reduce = useStableReducedMotion();
  // 어드민 오버라이드(hero 키)의 배경 영상/이미지. 없으면 기본 노을 영상.
  const heroUrl = media?.url?.trim() || '/videos/surface.mp4';
  const heroIsVideo = media?.url?.trim() ? media.type === 'video' : true;
  const videoRef = useRef<HTMLVideoElement>(null);
  // 모바일 자동재생 보장: 리액트는 SSR HTML에 muted 속성을 누락시켜(알려진 이슈)
  // iOS/안드로이드에서 자동재생이 차단된다. 하이드레이션 후 muted를 강제하고 play()를 직접 호출한다.
  // 히어로 배경 영상은 무음·장식용 루프라 reduced-motion(애니메이션 제거)에서도 재생한다.
  // 모션 저감은 아래 스크롤 패럴랙스(contentY·contentOpacity)에만 적용한다.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [heroUrl, heroIsVideo]);
  // 텍스트도 어드민 오버라이드 → 비어 있으면 로케일별 기본값(i18n). 제목/부제는 \n 으로 여러 줄.
  const eyebrow = text?.eyebrow?.trim() || HERO_DEFAULTS.eyebrow;
  const titleLines = (text?.title?.trim() || `${t('heroTitle1')}\n${t('heroTitle2')}`).split('\n');
  const subtitleLines = (
    text?.subtitle?.trim() || `${t('heroSubtitle1')}\n${t('heroSubtitle2')}`
  ).split('\n');
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '38%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative -mt-16 flex min-h-[100svh] items-center justify-center overflow-hidden sm:-mt-[111px]"
    >
      {/* 히어로 배경 — 어드민 편집(hero 키). 영상은 원본 색 그대로. reduced-motion에서도 재생. */}
      {heroIsVideo ? (
        <video
          key={heroUrl}
          ref={videoRef}
          src={heroUrl}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-placeholder.svg"
          aria-hidden
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}
      {/* 가독성 스크림 — 영상 색을 가리지 않도록 상단·중앙은 투명, 하단만 어둡게(텍스트 대비 유지) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#04202f]/85" />
      {/* 텍스트 영역 국소 스크림 — 영상 색(하늘·바다)은 가장자리에 남기고, 글자 뒤(중앙)만 충분히 어둡게(부제 AA 대비 확보) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(82%_56%_at_50%_52%,rgba(2,16,26,0.84)_0%,rgba(2,16,26,0.5)_46%,rgba(2,16,26,0.12)_70%,transparent_84%)]"
        aria-hidden
      />
      {/* 수중 광선 */}
      <div
        className="ocean-rays absolute -top-1/4 left-1/2 h-[150%] w-[60%] -translate-x-1/2 mix-blend-screen"
        style={{
          background:
            'linear-gradient(180deg, rgba(150,240,255,0.30) 0%, rgba(120,220,240,0.06) 45%, transparent 80%)',
          filter: 'blur(8px)'
        }}
        aria-hidden
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto max-w-3xl px-6 text-center [text-shadow:0_1px_3px_rgba(0,0,0,0.55),0_2px_22px_rgba(0,0,0,0.45)]"
      >
        <R as="p" className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] [text-indent:0.32em] text-cyan-200/90">
          {eyebrow}
        </R>
        <h1 className="font-serif text-[2.6rem] font-medium leading-[1.08] text-white sm:text-6xl lg:text-7xl">
          {titleLines.map((line, i) => {
            // 줄이 2개 이상이면 마지막 줄을 강조색(오션)으로
            const accent = titleLines.length > 1 && i === titleLines.length - 1;
            return (
              <R key={i} as="span" className={i === 0 ? 'block' : 'mt-1 block'} delay={0.05 + i * 0.07}>
                {accent ? <span className="text-ocean">{line}</span> : line}
              </R>
            );
          })}
        </h1>
        <R delay={0.2} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          {subtitleLines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br className="hidden sm:block" />}
              {line}
              {i < subtitleLines.length - 1 ? ' ' : ''}
            </span>
          ))}
        </R>

        <R delay={0.3} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/reserve"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-bold text-[#06202f] shadow-[0_8px_30px_rgba(246,166,35,0.35)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-amber-300 hover:shadow-[0_10px_38px_rgba(246,166,35,0.5)] active:scale-[0.97] sm:w-auto"
          >
            {extra?.ctaReserve?.trim() || t('ctaReserve')}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="#activities"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/50 hover:bg-white/10 sm:w-auto"
          >
            {extra?.ctaExplore?.trim() || t('ctaExplore')}
          </a>
        </R>

        {/* 신뢰 배지 */}
        <R delay={0.4} className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/65">
          {(extra?.badges?.length ? extra.badges : [t('badge1'), t('badge2'), t('badge3')]).map((b, i) => (
            <span key={b} className="inline-flex items-center gap-2">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-white/30" />}
              {b}
            </span>
          ))}
        </R>
      </motion.div>

      {/* 스크롤 큐 — 가로 중앙정렬(외부 div의 -translate-x-1/2)과 둥둥 애니메이션(내부 div의 translateY)을
          분리. 같은 요소에 두면 ocean-bob 의 transform 이 -translate-x-1/2 를 덮어써 가로 중앙이 어긋난다. */}
      {!reduce && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <div className="ocean-bob flex flex-col items-center text-white/60">
            <span className="mb-2 text-[10px] uppercase tracking-[0.3em] [text-indent:0.3em]">
              Dive Deeper
            </span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   ACTIVITY — 다이빙 / PADI / 낚시 / 스노클링 (가로 캐러셀, 좌우 스와이프)
   ──────────────────────────────────────────────────────────── */
function ActivityCard({ a, image, copy }: { a: Activity; image: string; copy?: TourCardCopy }) {
  const t = useTranslations('ocean');
  const tNav = useTranslations('nav');
  // 카테고리 표시명·태그라인·설명: 어드민 오버라이드 우선, 없으면 i18n/nav 기본값.
  const categoryName = copy?.title?.trim() || tNav(a.id);
  const tagline = copy?.tagline?.trim() || t(`tagline.${a.id}`);
  const desc = copy?.desc?.trim() || t(`desc.${a.id}`);
  return (
    <article className="group flex w-[80vw] max-w-[400px] shrink-0 snap-start snap-always flex-col overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.04] shadow-[0_16px_36px_-18px_rgba(0,0,0,0.5)] transition-colors hover:border-white/20 sm:w-[400px]">
      {/* 이미지 */}
      <div className="relative aspect-[16/11] w-full overflow-hidden">
        <img
          src={image}
          alt={t('cardAlt', { name: categoryName })}
          width={1200}
          height={825}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#02101e]/75 via-transparent to-transparent" />
        <span
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${a.accent}26`, color: a.accent }}
        >
          {a.kicker}
        </span>
        <span
          className="pointer-events-none absolute -bottom-3 right-3 font-serif text-[5.5rem] font-bold leading-none text-white/10"
          aria-hidden
        >
          {a.no}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-balance font-serif text-2xl text-white">{categoryName}</h3>
        <p className="mt-1.5 text-sm font-medium text-white/70">{tagline}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65">{desc}</p>

        {/* 하위 투어 */}
        <p className="mb-1 mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/65">
          {t('toursLabel')}
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
            style={{ backgroundColor: `${a.accent}22`, color: a.accent }}
          >
            {a.tours.length}
          </span>
        </p>
        <ul className="divide-y divide-white/10">
          {a.tours.map((tour) => (
            <li key={tour.slug}>
              <Link
                href={`/tours/${tour.slug}`}
                className="group/row -mx-2 flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: a.accent }} />
                  {TOUR_NAME_NAV_KEY[tour.slug] ? tNav(TOUR_NAME_NAV_KEY[tour.slug]) : tour.name}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 opacity-0 transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:opacity-100"
                  style={{ color: a.accent }}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ActivitiesSection({
  tourImages,
  copy
}: {
  tourImages?: Record<string, string>;
  copy?: HomeTourCopy;
}) {
  const t = useTranslations('ocean');
  const reduce = useStableReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  // 스크롤 가능 여부 + 시작/끝 위치(양옆 화살표 표시·비활성용)
  const [scrollable, setScrollable] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setScrollable(max > 4);
      setAtStart(el.scrollLeft <= 2);
      setAtEnd(el.scrollLeft >= max - 2);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    const t = setTimeout(update, 300); // 이미지·레이아웃 안정 후 재측정
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const nudge = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('article');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  };

  // 화살표는 PC(lg+)에서만 표시 — 카드 바깥 lane에 두어 텍스트와 무관, 세로는 카드 중앙(top-1/2).
  // 모바일·태블릿(터치)은 화살표를 숨기고 'peek(옆 카드 살짝 노출) + 스와이프'로 좌우 탐색을 유도한다.
  // (모바일에서 화살표를 카드 위에 얹으면 어느 높이든 본문 텍스트를 가리므로 근본적으로 제거.)
  const arrowCls =
    'absolute lg:top-1/2 z-10 hidden lg:grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#02101e]/60 text-white shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-white/50 hover:bg-[#02101e]/85 disabled:pointer-events-none disabled:opacity-0 sm:h-14 sm:w-14';

  return (
    <section id="activities" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-container px-6">
        <div className="mx-auto max-w-2xl text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            What We Offer
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance whitespace-pre-line font-serif text-4xl text-white sm:text-5xl">
              {copy?.sectionTitle?.trim() || t('activitiesTitle')}
            </h2>
          </R>
          <R delay={0.12} className="mt-4 whitespace-pre-line text-pretty text-white/65">
            {copy?.sectionIntro?.trim() || t('activitiesIntro')}
          </R>
        </div>
      </div>

      {/* 가로 스크롤 트랙 + 양옆 글래스 화살표(끝에선 자동 숨김)
          PC(lg+): max-w 제한을 풀어 카드 영역을 화면 폭만큼 넓히고(답답함 해소),
          래퍼 좌우 패딩(lg:px-20)으로 '스크롤과 무관한' 고정 lane을 만들어 화살표를 페이지 양 끝에 둔다.
          스크롤러 자체에 패딩을 주면 스크롤 시 밀려나 카드 위로 겹친다. 모바일/태블릿은 컨테이너 폭 유지. */}
      <div className="relative mx-auto mt-12 max-w-container lg:max-w-none lg:px-20">
        <div
          ref={scrollerRef}
          role="region"
          aria-label={t('carouselRegion')}
          tabIndex={0}
          className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-px-6 px-6 pb-3 lg:scroll-px-0 lg:px-0"
        >
          {ACTIVITIES.map((a) => (
            <ActivityCard
              key={a.id}
              a={a}
              image={tourImages?.[a.id]?.trim() || a.image}
              copy={copy?.cards?.[a.id]}
            />
          ))}
        </div>

        {scrollable && (
          <>
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={atStart}
              aria-label={t('prevTour')}
              className={`${arrowCls} left-2 sm:left-4 lg:left-3`}
            >
              <ArrowRight className="h-6 w-6 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={atEnd}
              aria-label={t('nextTour')}
              className={`${arrowCls} right-2 sm:right-4 lg:right-3`}
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   ASSURANCE — 왜 우리인가
   ──────────────────────────────────────────────────────────── */
function AssuranceSection({ data }: { data?: HomeAssurances }) {
  const t = useTranslations('ocean');
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-container px-6">
        {/* 보증 카드 */}
        <div className="text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            Why OKINITY
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance whitespace-pre-line font-serif text-4xl text-white sm:text-5xl">
              {data?.sectionTitle?.trim() || t('assuranceTitle')}
            </h2>
          </R>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ASSURANCES.map((a, i) => {
            const Icon = ASSURANCE_ICONS[i] ?? Shield;
            const ov = data?.items?.[i];
            return (
              <R key={a.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-cyan-300/40 hover:bg-white/[0.07]">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200 transition-colors duration-300 group-hover:bg-cyan-300/20">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-balance text-base font-semibold text-white">
                    {ov?.title?.trim() || t(`assurance${i + 1}Title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {ov?.desc?.trim() || t(`assurance${i + 1}Desc`)}
                  </p>
                </div>
              </R>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   BLOG — 오늘의 오키니티 (실제 데이터 연동, 본 사이트 주력 기능)
   공개글 최신 3개 그리드 + 전체보기. 글 없으면 빈 상태.
   ──────────────────────────────────────────────────────────── */
function BlogSection({ posts, locale }: { posts: BlogPost[]; locale: string }) {
  const t = useTranslations('ocean');
  const tBlog = useTranslations('blog');
  const featured = posts.slice(0, 3);
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-container px-6">
        {/* 헤더 — 다른 섹션과 동일하게 가운데 정렬 */}
        <div className="mx-auto max-w-2xl text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            Journal
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance font-serif text-4xl text-white sm:text-5xl">{tBlog('sectionTitle')}</h2>
          </R>
          <R delay={0.12} className="mt-4 text-white/65">
            {tBlog('sectionIntro')}
          </R>
        </div>

        {featured.length > 0 ? (
          <>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, i) => (
                <R key={post.id} delay={i * 0.08}>
                  <BlogCard post={post} locale={locale} />
                </R>
              ))}
            </div>
            <R delay={0.1} className="mt-10 text-center">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/10"
              >
                {t('blogViewAll')}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </R>
          </>
        ) : (
          <R delay={0.15}>
            <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
              <p className="text-white/65">{t('blogEmpty')}</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-white"
              >
                {t('blogEmptyCta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </R>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   GALLERY — 어드민에 올린 모든 사진을 순서대로 반응형 그리드로
   ──────────────────────────────────────────────────────────── */
function GallerySection({ images }: { images?: string[] }) {
  const t = useTranslations('ocean');
  // 어드민 갤러리(gallery 키) 이미지가 있으면 그대로(순서 유지), 없으면 기본.
  const list = images && images.length ? images : GALLERY;
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-12 text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            Gallery
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance font-serif text-4xl text-white sm:text-5xl">{t('galleryTitle')}</h2>
          </R>
        </div>

        {/* 모든 사진 순서대로 — 반응형 격자(모바일 2 · sm 3 · lg 4열) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {list.map((src, i) => (
            // 스크롤 진입 시 좌상단부터 순서대로 떠오르는 stagger(delay는 누적 상한).
            <R key={`${i}-${src}`} y={20} delay={Math.min(i * 0.05, 0.45)}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02101e]/40 to-transparent" />
              </div>
            </R>
          ))}
        </div>
      </div>

      <R delay={0.1} className="mt-10 text-center">
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/10"
        >
          {t('galleryViewAll')}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </R>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   TESTIMONIALS
   ──────────────────────────────────────────────────────────── */
function Testimonials({ data }: { data?: HomeTestimonials }) {
  const t = useTranslations('ocean');
  // 어드민 오버라이드(내용 있는 항목)가 있으면 그것을, 없으면 i18n 샘플 후기를 렌더.
  const ovItems = (data?.items ?? []).filter((it) => it.quote?.trim() || it.name?.trim());
  const list =
    ovItems.length > 0
      ? ovItems.map((it) => ({ name: it.name, city: it.city, tour: it.tour, quote: it.quote }))
      : TESTIMONIALS.map((item, i) => ({
          name: item.name,
          city: t(`t${i + 1}City`),
          tour: t(`t${i + 1}Tour`),
          quote: t(`t${i + 1}Quote`)
        }));
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-container px-6">
        <div className="mx-auto max-w-2xl text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            Guest Stories
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance whitespace-pre-line font-serif text-4xl text-white sm:text-5xl">
              {data?.sectionTitle?.trim() || t('testimonialsTitle')}
            </h2>
          </R>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {list.map((item, i) => (
            <R key={i} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <div className="flex gap-0.5 text-amber-300" aria-label={t('ratingAria')}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/80">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full bg-cyan-300/15 text-sm font-bold text-cyan-100"
                    aria-hidden
                  >
                    {item.name.slice(0, 1)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-white">
                      {item.name}
                      {item.city ? ` · ${item.city}` : ''}
                    </span>
                    <span className="text-white/65">{item.tour}</span>
                  </span>
                </figcaption>
              </figure>
            </R>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   RESERVE — 일정표(실제 데이터, 본 사이트 P4) + 예약 CTA 통합. 마지막 섹션.
   ──────────────────────────────────────────────────────────── */
function ReserveSection({ schedule, locale }: { schedule: ScheduleData; locale: string }) {
  const t = useTranslations('ocean');
  return (
    <section className="relative overflow-hidden py-28 sm:py-32">
      {/* 집중 글로우 — 가장 깊은 구간이라 아주 미세하게만(단조 하강 유지) */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[120%] w-[120%] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 30%, rgba(34,211,238,0.05) 0%, transparent 70%)'
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-container px-6">
        <div className="mx-auto max-w-2xl text-center">
          <R as="p" className="text-xs font-semibold uppercase tracking-[0.3em] [text-indent:0.3em] text-cyan-200/80">
            Reserve
          </R>
          <R delay={0.06}>
            <h2 className="mt-3 text-balance font-serif text-4xl leading-tight text-white sm:text-5xl">
              {t('reserveTitle')}
            </h2>
          </R>
          <R delay={0.12} className="mx-auto mt-4 max-w-md text-white/65">
            {t('reserveIntro')}
          </R>
        </div>

        {/* 일정표 + 예약 통합 플래너 */}
        <R delay={0.15} className="mt-12">
          <ReservePlanner
            items={schedule.items}
            locale={locale}
            statusLabel={schedule.statusLabel}
          />
        </R>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   루트
   ──────────────────────────────────────────────────────────── */
export type HomeMedia = {
  /** Hero 배경(어드민 hero 키): mediaUrl + mediaType */
  hero?: { url?: string; type?: string };
  /** Hero 텍스트(어드민 hero 키): eyebrow/title/subtitle. 비우면 기본값 */
  heroText?: { eyebrow?: string; title?: string; subtitle?: string };
  /** 투어 카테고리 카드 이미지(어드민 home_tours 키): { [activityId]: url } */
  tours?: Record<string, string>;
  /** 갤러리 이미지 URL 배열(어드민 gallery 키) */
  gallery?: string[];
};

/** 홈 섹션 텍스트 어드민 오버라이드(기본 로케일에만 적용). 비면 i18n 기본값 사용. */
export type HomeContent = {
  heroExtra?: { badges?: string[]; ctaReserve?: string; ctaExplore?: string };
  tours?: HomeTourCopy;
  assurances?: HomeAssurances;
  testimonials?: HomeTestimonials;
};

export default function OceanHome({
  posts,
  locale,
  schedule,
  media,
  content
}: {
  posts: BlogPost[];
  locale: string;
  schedule: ScheduleData;
  media?: HomeMedia;
  content?: HomeContent;
}) {
  return (
    <div className="relative text-white">
      <CinematicBackground />
      <Particles />

      <Hero media={media?.hero} text={media?.heroText} extra={content?.heroExtra} />
      <WaveDivider />
      <ActivitiesSection tourImages={media?.tours} copy={content?.tours} />
      <AssuranceSection data={content?.assurances} />
      <BlogSection posts={posts} locale={locale} />
      <GallerySection images={media?.gallery} />
      <Testimonials data={content?.testimonials} />
      <WaveDivider flip />
      <ReserveSection schedule={schedule} locale={locale} />
    </div>
  );
}
