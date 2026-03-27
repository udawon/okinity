'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { tourCategories } from '@/lib/tours';

export function ToursSection() {
  const t = useTranslations('tours');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';

  return (
    <section id="tours" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
          <p className="mt-4 text-white/50 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tourCategories.map((category, i) => {
            const href = `/tours/${category.slug}`;

            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={href}>
                  <div className="glass group relative overflow-hidden rounded-2xl transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-teal-500/5">
                    {/* Image area */}
                    <div className="relative h-56 overflow-hidden bg-ocean-700">
                      <Image
                        src={category.image}
                        alt={category.title[lang]}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 via-ocean-900/30 to-transparent z-10" />
                      <div className="absolute top-4 left-4 z-20 text-3xl">
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

                      {/* Sub-tour tags */}
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
          })}
        </div>
      </div>
    </section>
  );
}
