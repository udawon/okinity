import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getGallery, getReviews } from '@/lib/content';
import Container from '@/components/Container';
import Hero from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import CarouselSection from '@/components/CarouselSection';
import { CarouselItem } from '@/components/Carousel';
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
  const tProducts = await getTranslations('products');
  const tGallery = await getTranslations('gallery');

  const products = getAllProducts(locale as Locale);
  const reviews = getReviews(locale as Locale);
  const galleryPreview = getGallery().slice(0, 6);

  const categories = [
    { href: '/diving', title: tNav('diving'), description: tHome('cardDiving'), image: '/images/ph-1.svg' },
    { href: '/padi', title: tNav('padi'), description: tHome('cardPadi'), image: '/images/ph-3.svg' },
    { href: '/schedule', title: tNav('schedule'), description: tHome('cardSchedule'), image: '/images/ph-4.svg' },
    { href: '/gallery', title: tNav('gallery'), description: tHome('cardGallery'), image: '/images/ph-2.svg' }
  ];

  return (
    <>
      <Hero />

      {/* 투어 프로그램 — Must-Do 스타일 카루셀 (이미지 위 + 내용 아래) + 화살표 */}
      {products.length > 0 && (
        <CarouselSection
          title={tProducts('sectionTitle')}
          intro={tProducts('sectionSubtitle')}
        >
          {products.map((p) => (
            <CarouselItem key={p.slug}>
              <ProductCard product={p} />
            </CarouselItem>
          ))}
        </CarouselSection>
      )}

      {/* 시그니처 경험 — Signature 스타일 카루셀 (키 큰 다크 오버레이) + 화살표.
          배경은 투어 상품과 동일(페이지 베이지) — 레퍼런스처럼 섹션 간 여백 연속. */}
      <CarouselSection
        title={tHome('signatureTitle')}
        intro={tHome('signatureIntro')}
        align="left"
      >
        {categories.map((c) => (
          <CarouselItem key={c.href} fixed>
            <CategoryCard
              href={c.href}
              title={c.title}
              description={c.description}
              image={c.image}
            />
          </CarouselItem>
        ))}
      </CarouselSection>

      {/* 카카오톡 실시간 문의 밴드 */}
      <KakaoBand />

      {/* 갤러리 미리보기 */}
      {galleryPreview.length > 0 && (
        <section className="py-16 sm:py-20">
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
