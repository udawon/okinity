'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { TourCategory } from '@/lib/tours';
import { useTranslations } from 'next-intl';

export function CategoryCard({ category, index }: { category: TourCategory; index: number }) {
  const t = useTranslations('tours');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';

  // For categories with only one tour (like BBQ), link directly to tour detail
  const href = category.tours.length === 1
    ? `/tours/${category.slug}/${category.tours[0].slug}`
    : `/tours/${category.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={href}>
        <div className="glass group relative overflow-hidden rounded-2xl transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-teal-500/5">
          {/* Image area */}
          <div className="relative h-56 overflow-hidden bg-ocean-700">
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              {category.icon}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white group-hover:text-teal-400 transition-colors">
              {category.title[lang]}
            </h3>
            <p className="mt-2 text-sm text-white/60 line-clamp-2">
              {category.description[lang]}
            </p>

            {/* Sub-tour count */}
            {category.tours.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {category.tours.map((tour) => (
                  <span
                    key={tour.id}
                    className="text-xs text-white/40 bg-white/5 rounded-full px-3 py-1"
                  >
                    {tour.title[lang]}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-white/40">
                {category.tours.length > 1
                  ? `${category.tours.length} ${t('programs')}`
                  : category.tours[0].durationLabel[lang]}
              </span>
              <span className="text-xs text-teal-400 group-hover:translate-x-1 transition-transform">
                {t('viewDetails')} →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
