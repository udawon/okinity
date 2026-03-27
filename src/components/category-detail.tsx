'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { TourCategory } from '@/lib/tours';

export function CategoryDetail({ category }: { category: TourCategory }) {
  const t = useTranslations('tours');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden h-48 md:h-64 bg-ocean-700 mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center text-7xl">
            {category.icon}
          </div>
          <div className="absolute bottom-6 left-6 z-20">
            <h1 className="text-3xl md:text-4xl font-bold">
              {category.title[lang]}
            </h1>
            <p className="mt-2 text-white/60">
              {category.description[lang]}
            </p>
          </div>
        </motion.div>

        {/* Sub-tour list */}
        <div className="space-y-4">
          {category.tours.map((tour, i) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/tours/${category.slug}/${tour.slug}`}>
                <div className="glass group rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-teal-500/5">
                  <div className="flex flex-col sm:flex-row">
                    {/* Icon area */}
                    <div className="sm:w-48 h-32 sm:h-auto bg-ocean-700 flex items-center justify-center text-4xl shrink-0">
                      {category.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                            {tour.title[lang]}
                          </h3>
                          <p className="mt-2 text-sm text-white/60 line-clamp-2">
                            {tour.description[lang]}
                          </p>
                        </div>
                        <span className="text-teal-400 text-sm shrink-0 group-hover:translate-x-1 transition-transform mt-1">
                          {t('viewDetails')} →
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                        <div>
                          <span className="text-white/40 text-xs">{t('charter')}</span>
                          <span className="ml-2 text-gold-400 font-bold">
                            ¥{tour.priceCharter.toLocaleString()}
                          </span>
                        </div>
                        {tour.pricePerPerson && (
                          <div>
                            <span className="text-white/40 text-xs">{t('perPerson')}</span>
                            <span className="ml-2 text-white/70">
                              ¥{tour.pricePerPerson.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="text-white/40 text-xs">
                          {tour.durationLabel[lang]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
