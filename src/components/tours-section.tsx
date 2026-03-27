'use client';

import { useTranslations } from 'next-intl';
import { tourCategories } from '@/lib/tours';
import { CategoryCard } from './category-card';

export function ToursSection() {
  const t = useTranslations('tours');

  return (
    <section id="tours" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
          <p className="mt-4 text-white/50 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tourCategories.map((category, i) => (
            <CategoryCard key={category.slug} category={category} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
