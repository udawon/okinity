'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { Tour } from '@/lib/tours';
import { getCategoryBySlug } from '@/lib/tours';

export function TourDetail({ tour }: { tour: Tour }) {
  const t = useTranslations('tours');
  const tConsult = useTranslations('consultation');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';
  const category = getCategoryBySlug(tour.categorySlug);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        {category && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 text-sm text-white/40"
          >
            <Link href="/#tours" className="hover:text-white/60 transition-colors">
              {t('title')}
            </Link>
            <span>/</span>
            {category.tours.length > 1 ? (
              <Link
                href={`/tours/${category.slug}`}
                className="hover:text-white/60 transition-colors"
              >
                {category.title[lang]}
              </Link>
            ) : (
              <span>{category.title[lang]}</span>
            )}
            <span>/</span>
            <span className="text-white/60">{tour.title[lang]}</span>
          </motion.div>
        )}

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden h-64 md:h-80 bg-ocean-700 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center text-7xl">
            {category?.icon || '⛵'}
          </div>
          <div className="absolute bottom-6 left-6 z-20">
            <h1 className="text-3xl md:text-4xl font-bold">
              {tour.title[lang]}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-white/70 leading-relaxed text-lg">
                {tour.description[lang]}
              </p>
            </motion.div>

            {/* Includes */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                {t('includes')}
              </h3>
              <ul className="space-y-2">
                {tour.includes[lang].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <span className="text-teal-400 text-xs">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="glass rounded-xl p-6 space-y-4">
              <div>
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  {t('charter')}
                </span>
                <div className="text-3xl font-bold text-gold-400">
                  ¥{tour.priceCharter.toLocaleString()}
                </div>
                <span className="text-xs text-white/40">
                  / max {tour.maxPersons}{' '}
                  {lang === 'ko' ? '명' : lang === 'ja' ? '名' : 'guests'}
                </span>
              </div>

              {tour.pricePerPerson && (
                <div className="border-t border-white/10 pt-4">
                  <span className="text-xs text-white/40 uppercase tracking-wider">
                    {t('perPerson')}
                  </span>
                  <div className="text-xl font-semibold text-white/90">
                    ¥{tour.pricePerPerson.toLocaleString()}
                  </div>
                  <span className="text-xs text-white/40">
                    *{tour.minPersons}
                    {t('minPersons')}
                  </span>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 flex items-center gap-2">
                <span className="text-xs text-white/40">{t('duration')}</span>
                <span className="text-sm text-white/80">
                  {tour.durationLabel[lang]}
                </span>
              </div>
            </div>

            {/* CTA */}
            <motion.a
              href="#consultation-inline"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block w-full rounded-full bg-teal-500 py-3.5 text-center text-sm font-semibold text-ocean-900 hover:bg-teal-400 transition-colors"
            >
              {tConsult('submit')}
            </motion.a>
          </div>
        </div>
      </div>
    </div>
  );
}
