import { getTranslations } from 'next-intl/server';
import { type Review } from '@/lib/content';
import Container from './Container';

export default async function ReviewList({ reviews }: { reviews: Review[] }) {
  const t = await getTranslations('reviews');

  return (
    <section className="bg-surface py-20">
      <Container>
        <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
          {t('sectionTitle')}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-6 text-center text-muted">{t('empty')}</p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <li
                key={i}
                className="rounded-card border border-line bg-bg p-6 shadow-card"
              >
                <div className="text-accent" aria-label={`${r.rating} / 5`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-line">{'★'.repeat(5 - r.rating)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">{r.text}</p>
                <p className="mt-4 text-sm font-semibold text-muted">— {r.author}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
