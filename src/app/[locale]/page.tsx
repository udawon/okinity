import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { getAllProducts, getGallery, getReviews, type GalleryItem } from '@/lib/content';
import { getSiteContentMap, CONTENT_KEYS, mergeOverride } from '@/lib/site-content';
import { parseBlogItems, publishedSorted, BLOG_CAROUSEL_LIMIT } from '@/lib/blog';
import Container from '@/components/Container';
import Hero, { type HeroOverride } from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import BlogCard from '@/components/BlogCard';
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

  const tProducts = await getTranslations('products');
  const tGallery = await getTranslations('gallery');
  const tBlog = await getTranslations('blog');

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

  // 오늘의 오키니티(블로그): 공개글 최신 8개를 캐러셀에
  const blogPosts = publishedSorted(parseBlogItems(overrides[CONTENT_KEYS.blog]?.items)).slice(
    0,
    BLOG_CAROUSEL_LIMIT
  );

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

      {/* 오늘의 오키니티 — 블로그 글 캐러셀(공개글 최신 8개) + 전체보기.
          글이 없으면 같은 자리에 빈 상태 섹션을 렌더해 섹션 순서(바다 깊이 매핑)를 유지. */}
      {blogPosts.length > 0 ? (
        <CarouselSection
          title={tBlog('sectionTitle')}
          intro={tBlog('sectionIntro')}
          align="left"
          moreHref="/blog"
          moreLabel={tBlog('more')}
        >
          {blogPosts.map((p) => (
            <CarouselItem key={p.id} fixed>
              <BlogCard post={p} locale={locale as Locale} />
            </CarouselItem>
          ))}
        </CarouselSection>
      ) : (
        <section className="py-20 sm:py-[195px]">
          <Container>
            <RevealWords
              as="h2"
              text={tBlog('sectionTitle')}
              className="font-serif text-4xl leading-tight text-white sm:text-5xl"
            />
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
                {tBlog('empty')}
              </p>
            </Reveal>
          </Container>
        </section>
      )}

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
