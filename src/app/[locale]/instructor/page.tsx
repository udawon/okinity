import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { getInstructor } from '@/lib/content';
import Container from '@/components/Container';
import Markdown from '@/components/Markdown';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'instructor' });
  const instructor = getInstructor(locale as Locale);
  return {
    title: t('sectionTitle'),
    description: instructor?.headline,
    robots: instructor?.fellBackToDefault
      ? { index: false, follow: true }
      : undefined
  };
}

export default async function InstructorPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('instructor');
  const tCommon = await getTranslations('common');
  const instructor = getInstructor(locale as Locale);

  if (!instructor) {
    return (
      <Container className="py-16">
        <p className="text-muted">{t('sectionTitle')}</p>
      </Container>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        {instructor.fellBackToDefault && (
          <p className="mb-6 rounded-button bg-brand-light px-4 py-3 text-sm text-brand-dark">
            {tCommon('translationPending')}
          </p>
        )}

        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div
            className="h-48 w-48 shrink-0 rounded-card bg-brand-light bg-cover bg-center"
            style={{ backgroundImage: `url(${instructor.photo})` }}
            role="img"
            aria-label={instructor.name}
          />
          <div>
            <h1 className="text-3xl font-extrabold text-ink">{instructor.name}</h1>
            <p className="mt-2 text-lg text-brand-dark">{instructor.headline}</p>
            {instructor.yearsExperience != null && (
              <p className="mt-1 text-muted">
                {t('experience', { years: instructor.yearsExperience })}
              </p>
            )}
          </div>
        </div>

        {instructor.certifications.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">{t('certifications')}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {instructor.certifications.map((c, i) => (
                <li
                  key={i}
                  className="rounded-button bg-brand-light px-3 py-1 text-sm font-medium text-brand-dark"
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
      </Container>
    </section>
  );
}
