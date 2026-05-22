import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Container from './Container';

/** 첫 화면 — "Miti Navi" 톤. 평면 양피지 배경, 세리프 헤드라인, 모노 UI, 각진 구조. */
export default async function Hero() {
  const t = await getTranslations('hero');
  const trust = [t('trust1'), t('trust2'), t('trust3')];

  return (
    <section className="border-b border-line bg-bg">
      <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          {/* Outlined accent (Amber Glaze) — mono, uppercase tracking */}
          <span className="inline-flex items-center border border-accent px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] text-ink">
            {t('eyebrow')}
          </span>

          {/* Serif display headline, weight 400 */}
          <h1 className="mt-6 whitespace-pre-line break-keep font-serif text-4xl font-normal leading-[1.1] text-ink sm:text-5xl">
            {t('title')}
          </h1>

          <p className="mt-6 max-w-xl break-keep font-mono text-sm leading-relaxed tracking-[0.02em] text-muted sm:text-base">
            {t('subtitle')}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {/* Filled button — Deep Charcoal / Parchment text, 0 radius, mono */}
            <Link
              href="/contact"
              className="bg-brand px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] text-brand-contrast transition-colors hover:bg-brand-dark"
            >
              {t('cta')}
            </Link>
            {/* Outlined link — Amber Glaze border */}
            <Link
              href="/products"
              className="border border-accent px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-light"
            >
              {t('ctaSecondary')}
            </Link>
          </div>

          {/* 신뢰 항목 — mono, 미니멀 */}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.06em] text-muted">
            {trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-accent-dark">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 사진 영역 (placeholder — 실제 다이빙 사진으로 교체). 각진·평면. */}
        <div
          className="aspect-[4/5] w-full bg-brand-light bg-cover bg-center sm:aspect-[4/3] lg:aspect-[4/5]"
          style={{ backgroundImage: 'url(/images/placeholder.svg)' }}
          role="img"
          aria-label="오키나와 다이빙"
        />
      </Container>
    </section>
  );
}
