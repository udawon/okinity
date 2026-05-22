import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGallery } from '@/lib/content';
import Container from '@/components/Container';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function GalleryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('gallery');
  const items = getGallery();

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h1 className="font-serif text-3xl font-normal text-ink sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 font-mono text-sm tracking-[0.02em] text-muted">
          {t('subtitle')}
        </p>

        {items.length === 0 ? (
          <p className="mt-8 text-muted">{t('empty')}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {items.map((it, i) => (
              <figure
                key={i}
                className="overflow-hidden rounded-card bg-surface shadow-card"
              >
                <div
                  className="aspect-square w-full bg-brand-light bg-cover bg-center"
                  style={{ backgroundImage: `url(${it.image})` }}
                  role="img"
                  aria-label={it.caption ?? `gallery ${i + 1}`}
                />
                {it.caption && (
                  <figcaption className="px-3 py-2 text-xs text-muted">
                    {it.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
