'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { tourCategories } from '@/lib/tours';
import { ImageCarousel } from './image-carousel';

export function ToursSection() {
  const t = useTranslations('tours');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggle = (slug: string) => {
    setOpenCategory((prev) => (prev === slug ? null : slug));
  };

  return (
    <section id="tours" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
          <p className="mt-4 text-white/50 text-lg">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          {tourCategories.map((category, i) => {
            const isOpen = openCategory === category.slug;

            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {/* Accordion header */}
                <button
                  onClick={() => toggle(category.slug)}
                  className={`w-full glass rounded-2xl p-6 flex items-center justify-between gap-4 transition-all duration-300 hover:border-white/20 ${
                    isOpen ? 'border-teal-500/30 shadow-lg shadow-teal-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        {category.title[lang]}
                      </h3>
                      <p className="text-sm text-white/50 mt-0.5">
                        {category.description[lang]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {category.tours.length > 1 && (
                      <span className="text-xs text-white/30 hidden sm:block">
                        {category.tours.length} {t('programs')}
                      </span>
                    )}
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-teal-400 text-xl"
                    >
                      ▾
                    </motion.span>
                  </div>
                </button>

                {/* Accordion content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-3">
                        {category.tours.map((tour, j) => (
                          <motion.div
                            key={tour.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: j * 0.08 }}
                            className="glass rounded-xl p-5 hover:border-white/20 transition-all duration-300"
                          >
                            <div className="flex flex-col md:flex-row gap-5">
                              {/* Carousel */}
                              <div className="md:w-72 shrink-0">
                                <ImageCarousel
                                  images={tour.images}
                                  alt={tour.title[lang]}
                                />
                              </div>

                              {/* Tour info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-white">
                                  {tour.title[lang]}
                                </h4>
                                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                                  {tour.description[lang]}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                  <div>
                                    <span className="text-white/40 text-xs">{t('charter')}</span>
                                    <span className="ml-1.5 text-gold-400 font-bold">
                                      ¥{tour.priceCharter.toLocaleString()}
                                    </span>
                                  </div>
                                  {tour.pricePerPerson && (
                                    <div>
                                      <span className="text-white/40 text-xs">{t('perPerson')}</span>
                                      <span className="ml-1.5 text-white/70">
                                        ¥{tour.pricePerPerson.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-white/30 text-xs">
                                    {tour.durationLabel[lang]}
                                  </span>
                                </div>

                                <div className="mt-3">
                                  <Link
                                    href={`/tours/${category.slug}/${tour.slug}`}
                                    className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                  >
                                    {t('viewDetails')} →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
