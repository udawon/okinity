import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

/** 상품 카드 — Must-Do 스타일: 이미지 위 + 내용(카테고리·제목·설명·가격) 아래 흰 카드. */
export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
    >
      <div
        className="aspect-[4/3] w-full overflow-hidden bg-brand-light bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${product.heroImage})` }}
        role="img"
        aria-label={product.title}
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-brand-dark">
          {t(`category.${product.category}`)}
        </span>
        <h3 className="font-serif text-xl leading-tight text-ink">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-ink">
            {price ? t('priceFrom', { price }) : t('priceOnRequest')}
          </span>
          <span className="text-xs font-medium text-brand-dark">자세히 →</span>
        </div>
      </div>
    </Link>
  );
}
