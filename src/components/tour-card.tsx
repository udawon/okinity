'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import type { Tour } from '@/lib/tours';

const categoryIcons: Record<string, string> = {
  cruise: '⛵',
  business: '💼',
  filming: '🎬',
  festival: '🎆',
  party: '🎉',
  proposal: '💍',
};

export function TourCard({ tour, index }: { tour: Tour; index: number }) {
  const t = useTranslations('tours');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/tours/${tour.slug}`}>
        <div className="glass group relative overflow-hidden rounded-2xl transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-teal-500/5">
          {/* Image placeholder */}
          <div className="relative h-48 overflow-hidden bg-ocean-700">
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center text-5xl">
              {categoryIcons[tour.category]}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
              {tour.title[lang]}
            </h3>
            <p className="mt-2 text-sm text-white/60 line-clamp-2">
              {tour.description[lang]}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-xs text-white/40">{t('charter')}</span>
              <span className="text-xl font-bold text-gold-400">
                ¥{tour.priceCharter.toLocaleString()}
              </span>
            </div>
            {tour.pricePerPerson && (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xs text-white/40">{t('perPerson')}</span>
                <span className="text-sm text-white/70">
                  ¥{tour.pricePerPerson.toLocaleString()} / {t('perPerson')}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-white/40">
                {tour.durationLabel[lang]}
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
