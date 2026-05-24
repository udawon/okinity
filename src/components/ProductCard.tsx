import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Product, formatPriceKRW } from '@/lib/content';

/**
 * 상품 카드 — 레퍼런스 Must-Do 구성: 글자 없는 깨끗한 이미지(위) +
 * 핑크베이지 패널(아래)에 제목·설명·가격. 카드는 캐러셀에서 stretch되어 높이 통일,
 * 패널이 남은 높이를 채우고 가격행은 하단 고정(mt-auto).
 */
export default async function ProductCard({ product }: { product: Product }) {
  const t = await getTranslations('products');
  const price = formatPriceKRW(product.priceKRW);

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden">
        {/* 이미지 — 글자 없는 깨끗한 사진 */}
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-brand-light bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.heroImage})` }}
            role="img"
            aria-label={product.title}
          />
        </div>
        {/* 패널 — 제목 + 설명 + 가격/CTA */}
        <div className="flex flex-1 flex-col bg-panel px-7 py-8">
          <h3 className="font-serif text-2xl leading-snug text-ink sm:text-[28px]">
            {product.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            {product.summary}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-5">
            <span className="text-base font-semibold text-ink">
              {price ? t('priceFrom', { price }) : t('priceOnRequest')}
            </span>
            <span className="text-sm font-medium text-brand-dark">자세히 →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
