import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

/**
 * 상품 카드 — Must-Do 스타일: 사진 위 거대한 세리프 제목 오버레이 + 이미지 아래 설명.
 */
export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="relative aspect-[4/5] overflow-hidden">
        <div
          className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${product.heroImage})` }}
          role="img"
          aria-label={product.title}
        />
        <div className="absolute inset-0 bg-ink/30" />
        {/* 거대한 세리프 제목 (세로 중앙) */}
        <div className="absolute inset-0 flex items-center justify-center p-7">
          <h3 className="text-center font-serif text-3xl leading-[1.1] text-white drop-shadow-md sm:text-4xl">
            {product.title}
          </h3>
        </div>
      </div>
      {/* 설명·가격 (이미지 아래, 배경 위) */}
      <div className="px-1 pt-5">
        <p className="line-clamp-2 text-base leading-relaxed text-ink/80">
          {product.summary}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-ink">
            {price ? t('priceFrom', { price }) : t('priceOnRequest')}
          </span>
          <span className="text-sm font-medium text-brand-dark">자세히 →</span>
        </div>
      </div>
    </Link>
  );
}
