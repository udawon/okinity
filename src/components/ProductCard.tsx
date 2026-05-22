import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

/** 상품 카드 — 크고 대담한 이미지 오버레이. 사진 위 카테고리·제목·가격. */
export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="relative aspect-[4/5] h-full overflow-hidden rounded-card shadow-card transition-shadow duration-300 group-hover:shadow-hover">
        <div
          className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${product.heroImage})` }}
          role="img"
          aria-label={product.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/80">
            {t(`category.${product.category}`)}
          </span>
          <h3 className="mt-2 font-serif text-3xl leading-tight">{product.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-white/85">{product.summary}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-base font-semibold">
              {price ? t('priceFrom', { price }) : t('priceOnRequest')}
            </span>
            <span className="text-sm font-medium text-white/90">자세히 →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
