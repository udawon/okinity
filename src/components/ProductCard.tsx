import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden border border-line bg-surface transition-colors duration-200 hover:border-brand"
    >
      <div
        className="aspect-[4/3] w-full bg-brand-light bg-cover bg-center"
        style={{ backgroundImage: `url(${product.heroImage})` }}
        role="img"
        aria-label={product.title}
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
          {t(`category.${product.category}`)}
        </span>
        <h3 className="text-lg font-bold text-ink group-hover:text-brand-dark">
          {product.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted">{product.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-ink">
            {price ? t('priceFrom', { price }) : t('priceOnRequest')}
          </span>
          {product.durationHours != null && (
            <span className="text-xs text-muted">
              {t('durationHours', { hours: product.durationHours })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
