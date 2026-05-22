import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

/** 상품 카드 — 사진 위 카테고리·제목·가격 오버레이. 둥근 + 부드러운 그림자. */
export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block h-full"
    >
      <div className="relative aspect-[3/4] h-full overflow-hidden rounded-card shadow-card transition-shadow duration-300 group-hover:shadow-hover">
        <div
          className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${product.heroImage})` }}
          role="img"
          aria-label={product.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/80">
            {t(`category.${product.category}`)}
          </span>
          <h3 className="mt-1 font-serif text-2xl leading-tight">{product.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/85">{product.summary}</p>
          <span className="mt-3 inline-block text-sm font-semibold text-white">
            {price ? t('priceFrom', { price }) : t('priceOnRequest')}
          </span>
        </div>
      </div>
    </Link>
  );
}
