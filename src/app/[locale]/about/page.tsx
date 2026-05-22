import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getInstructor, getReviews } from '@/lib/content';
import Container from '@/components/Container';
import Markdown from '@/components/Markdown';
import ReviewList from '@/components/ReviewList';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const instructor = getInstructor(locale as Locale);
  return {
    title: t('title'),
    description: instructor?.headline,
    robots: instructor?.fellBackToDefault ? { index: false, follow: true } : undefined
  };
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('about');
  const tInstructor = await getTranslations('instructor');
  const tCommon = await getTranslations('common');
  const instructor = getInstructor(locale as Locale);
  const reviews = getReviews(locale as Locale);

  return (
    <>
      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">
            {t('title')}
          </h1>

          {instructor && (
            <>
              {instructor.fellBackToDefault && (
                <p className="mt-6 border border-accent px-4 py-3 font-mono text-xs text-ink">
                  {tCommon('translationPending')}
                </p>
              )}

              <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row">
                <div
                  className="h-48 w-48 shrink-0 bg-brand-light bg-cover bg-center"
                  style={{ backgroundImage: `url(${instructor.photo})` }}
                  role="img"
                  aria-label={instructor.name}
                />
                <div>
                  <p className="font-serif text-2xl text-ink">{instructor.name}</p>
                  <p className="mt-2 font-mono text-sm tracking-[0.02em] text-brand-dark">
                    {instructor.headline}
                  </p>
                  {instructor.yearsExperience != null && (
                    <p className="mt-1 font-mono text-xs text-muted">
                      {tInstructor('experience', { years: instructor.yearsExperience })}
                    </p>
                  )}
                </div>
              </div>

              {instructor.certifications.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-serif text-lg text-ink">
                    {tInstructor('certifications')}
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {instructor.certifications.map((c, i) => (
                      <li
                        key={i}
                        className="border border-line px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] text-muted"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {instructor.body && (
                <div className="mt-8">
                  <Markdown>{instructor.body}</Markdown>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      <ReviewList reviews={reviews} />
    </>
  );
}
