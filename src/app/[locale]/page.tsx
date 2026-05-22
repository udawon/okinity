import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getGallery, getReviews } from '@/lib/content';
import Container from '@/components/Container';
import Hero from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import KakaoBand from '@/components/KakaoBand';
import ReviewList from '@/components/ReviewList';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHome = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const tGallery = await getTranslations('gallery');
  const reviews = getReviews(locale as Locale);
  const galleryPreview = getGallery().slice(0, 6);

  const categories = [
    { href: '/diving', title: tNav('diving'), description: tHome('cardDiving') },
    { href: '/padi', title: tNav('padi'), description: tHome('cardPadi') },
    { href: '/schedule', title: tNav('schedule'), description: tHome('cardSchedule') },
    { href: '/gallery', title: tNav('gallery'), description: tHome('cardGallery') }
  ];

  return (
    <>
      <Hero />

      {/* 카테고리 카드 — 주요 섹션 진입 */}
      <section className="py-16">
        <Container>
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            {tHome('categoriesTitle')}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <CategoryCard
                key={c.href}
                href={c.href}
                title={c.title}
                description={c.description}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* 카카오톡 실시간 문의 밴드 */}
      <KakaoBand />

      {/* 갤러리 미리보기 */}
      {galleryPreview.length > 0 && (
        <section className="py-16">
          <Container>
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl text-ink sm:text-3xl">
                {tGallery('title')}
              </h2>
              <Link
                href="/gallery"
                className="font-mono text-xs uppercase tracking-[0.08em] text-brand-dark hover:text-ink"
              >
                {tGallery('viewMore')} →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {galleryPreview.map((it, i) => (
                <div
                  key={i}
                  className="aspect-square w-full border border-line bg-brand-light bg-cover bg-center"
                  style={{ backgroundImage: `url(${it.image})` }}
                  role="img"
                  aria-label={it.caption ?? `gallery ${i + 1}`}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      <ReviewList reviews={reviews} />
    </>
  );
}
