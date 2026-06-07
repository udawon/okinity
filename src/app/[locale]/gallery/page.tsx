import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getGallery, type GalleryItem } from '@/lib/content';
import { getSiteContent, CONTENT_KEYS } from '@/lib/site-content';
import { cdnMedia } from '@/lib/media';
import Container from '@/components/Container';

export const dynamic = 'force-dynamic';

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

  // 홈과 동일하게 어드민 갤러리(gallery 키) 업로드를 우선 사용, 없으면 시드(content/gallery.json).
  const override = await getSiteContent(CONTENT_KEYS.gallery);
  const overrideItems = (override as { items?: unknown } | null)?.items;
  const items: GalleryItem[] = Array.isArray(overrideItems)
    ? (overrideItems as GalleryItem[]).filter(
        (g) => g && typeof g.image === 'string' && g.image.trim()
      )
    : getGallery();

  return (
    <section className="py-12 sm:py-16">
      <Container className="[text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
        <h1 className="font-serif text-3xl font-normal text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{t('subtitle')}</p>

        {items.length === 0 ? (
          <p className="mt-8 text-white/65">{t('empty')}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {items.map((it, i) => (
              <figure
                key={i}
                className="overflow-hidden rounded-card border border-white/10 bg-white/[0.04] shadow-[0_16px_36px_-18px_rgba(0,0,0,0.5)]"
              >
                <div
                  className="aspect-square w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${cdnMedia(it.image)})` }}
                  role="img"
                  aria-label={it.caption ?? `gallery ${i + 1}`}
                />
                {it.caption && (
                  <figcaption className="px-3 py-2 text-xs text-white/70">
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
