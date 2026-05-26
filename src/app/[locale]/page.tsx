import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getGallery, getReviews, type GalleryItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS, mergeOverride } from '@/lib/site-content';
import Container from '@/components/Container';
import Hero, { type HeroOverride } from '@/components/Hero';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import CarouselSection from '@/components/CarouselSection';
import { CarouselItem } from '@/components/Carousel';
import ReviewList from '@/components/ReviewList';
import Reveal from '@/components/Reveal';
import RevealWords from '@/components/RevealWords';
import ScrollSnap from '@/components/ScrollSnap';

// 어드민 콘텐츠 편집을 즉시 반영하기 위해 동적 렌더링.
// (Supabase 미설정 시에도 오버라이드 조회는 빈 객체라 비용 거의 없음)
export const dynamic = 'force-dynamic';

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

  // 어드민 오버라이드 일괄 조회 (Supabase 미설정 시 빈 객체 → md 기본값만 사용)
  const overrides = await getSiteContentMap();
  const heroOverride = overrides[CONTENT_KEYS.hero] as HeroOverride | undefined;

  // 투어 상품: md 기본값 + product:{slug} 오버라이드
  const products = getAllProducts(locale as Locale).map((p) =>
    mergeOverride(p, overrides[CONTENT_KEYS.product(p.slug)])
  );
  const reviews = getReviews(locale as Locale);

  // 갤러리: gallery 오버라이드의 items 배열 우선, 없으면 json
  const galleryOverrideItems = overrides[CONTENT_KEYS.gallery]?.items;
  const galleryItems: GalleryItem[] = Array.isArray(galleryOverrideItems)
    ? (galleryOverrideItems as GalleryItem[])
    : getGallery();
  const galleryPreview = galleryItems.slice(0, 6);

  // 시그니처 경험: 기본값 + signature:{href} 오버라이드(이미지/동영상/제목/설명)
  const baseCategories = [
    { href: '/diving', title: tNav('diving'), description: tHome('cardDiving'), image: '/images/ph-1.svg' },
    { href: '/padi', title: tNav('padi'), description: tHome('cardPadi'), image: '/images/ph-3.svg' },
    { href: '/schedule', title: tNav('schedule'), description: tHome('cardSchedule'), image: '/images/ph-4.svg' },
    { href: '/gallery', title: tNav('gallery'), description: tHome('cardGallery'), image: '/images/ph-2.svg' }
  ];
  const categories = baseCategories.map((c) => {
    const o = overrides[CONTENT_KEYS.signature(c.href)] ?? {};
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    return {
      href: c.href,
      title: str(o.title) ?? c.title,
      description: str(o.description) ?? c.description,
      image: str(o.image) ?? c.image,
      video: str(o.video)
    };
  });

  return (
    <>
      <ScrollSnap />
      <Hero override={heroOverride} />

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
              video={c.video}
            />
          </CarouselItem>
        ))}
      </CarouselSection>

      {/* 갤러리 미리보기 */}
      {galleryPreview.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container>
            <RevealWords
              as="h2"
              text={tGallery('title')}
              className="text-center font-serif text-3xl text-white sm:text-4xl"
            />
            <Reveal delay={0.1}>
              <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
                {tGallery('subtitle')}
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {galleryPreview.map((it, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div
                    className="aspect-square w-full overflow-hidden rounded-card border border-white/10 bg-white/5 bg-cover bg-center"
                    style={{ backgroundImage: `url(${it.image})` }}
                    role="img"
                    aria-label={it.caption ?? `gallery ${i + 1}`}
                  />
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1} className="mt-8 text-center">
              <Link
                href="/gallery"
                className="rounded-button border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/10"
              >
                {tGallery('viewMore')}
              </Link>
            </Reveal>
          </Container>
        </section>
      )}

      <ReviewList reviews={reviews} />
    </>
  );
}
