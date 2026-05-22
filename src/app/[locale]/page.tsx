import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getGallery, getReviews } from '@/lib/content';
import Container from '@/components/Container';
import Hero from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import Carousel, { CarouselItem } from '@/components/Carousel';
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

      {/* 프로그램 안내 — 중앙 정렬 제목 + 가로 카루셀 */}
      <section className="py-20">
        <Container>
          <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
            {tHome('categoriesTitle')}
          </h2>
          <div className="mt-10">
            <Carousel>
              {categories.map((c) => (
                <CarouselItem key={c.href}>
                  <CategoryCard
                    href={c.href}
                    title={c.title}
                    description={c.description}
                  />
                </CarouselItem>
              ))}
            </Carousel>
          </div>
        </Container>
      </section>

      {/* 카카오톡 실시간 문의 밴드 */}
      <KakaoBand />

      {/* 갤러리 미리보기 */}
      {galleryPreview.length > 0 && (
        <section className="py-20">
          <Container>
            <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
              {tGallery('title')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              {tGallery('subtitle')}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {galleryPreview.map((it, i) => (
                <div
                  key={i}
                  className="aspect-square w-full overflow-hidden rounded-card bg-brand-light bg-cover bg-center shadow-card"
                  style={{ backgroundImage: `url(${it.image})` }}
                  role="img"
                  aria-label={it.caption ?? `gallery ${i + 1}`}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/gallery"
                className="rounded-button border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-card transition-colors hover:border-brand hover:text-brand-dark"
              >
                {tGallery('viewMore')}
              </Link>
            </div>
          </Container>
        </section>
      )}

      <ReviewList reviews={reviews} />
    </>
  );
}
