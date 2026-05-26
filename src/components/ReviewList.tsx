import { getTranslations } from 'next-intl/server';
import { type Review } from '@/lib/content';
import Container from './Container';
import Reveal from './Reveal';

export default async function ReviewList({ reviews }: { reviews: Review[] }) {
  const t = await getTranslations('reviews');

  return (
    <section className="py-20">
      <Container>
        <Reveal>
          <h2 className="text-center font-serif text-3xl text-white sm:text-4xl">
            {t('sectionTitle')}
          </h2>
        </Reveal>
        {reviews.length === 0 ? (
          <p className="mt-6 text-center text-white/50">{t('empty')}</p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal as="li" key={i} delay={i * 0.08}>
                <div className="h-full rounded-card border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm">
                  <div className="text-[#f2c879]" aria-label={`${r.rating} / 5`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-white/20">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{r.text}</p>
                  <p className="mt-4 text-sm font-semibold text-white/55">— {r.author}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
