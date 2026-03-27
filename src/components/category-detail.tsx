'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { TourCategory } from '@/lib/tours';
import { ImageCarousel } from './image-carousel';

export function CategoryDetail({ category }: { category: TourCategory }) {
  const t = useTranslations('tours');
  const tConsult = useTranslations('consultation');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';

  // First sub-tour open by default
  const [openTour, setOpenTour] = useState<string>(category.tours[0]?.slug || '');

  const toggle = (slug: string) => {
    setOpenTour((prev) => (prev === slug ? '' : slug));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center gap-2 text-sm text-white/40"
        >
          <Link href="/#tours" className="hover:text-white/60 transition-colors">
            {t('title')}
          </Link>
          <span>/</span>
          <span className="text-white/60">{category.title[lang]}</span>
        </motion.div>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden h-48 md:h-64 bg-ocean-700 mb-10"
        >
          <Image
            src={category.image}
            alt={category.title[lang]}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/90 via-ocean-900/40 to-ocean-900/20 z-10" />
          <div className="absolute bottom-6 left-6 z-20">
            <h1 className="text-3xl md:text-4xl font-bold">
              {category.title[lang]}
            </h1>
            <p className="mt-2 text-white/60">
              {category.description[lang]}
            </p>
          </div>
        </motion.div>

        {/* Sub-tour accordion */}
        <div className="space-y-3">
          {category.tours.map((tour, i) => {
            const isOpen = openTour === tour.slug;

            return (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {/* Accordion header */}
                <button
                  onClick={() => toggle(tour.slug)}
                  className={`w-full glass rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:border-white/20 ${
                    isOpen ? 'border-teal-500/30 shadow-lg shadow-teal-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        {tour.title[lang]}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gold-400 font-medium">
                          ¥{tour.priceCharter.toLocaleString()}
                        </span>
                        <span className="text-xs text-white/30">
                          {tour.durationLabel[lang]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-teal-400 text-xl shrink-0"
                  >
                    ▾
                  </motion.span>
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
                      <div className="glass rounded-2xl mt-2 p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Carousel */}
                          <div className="md:w-80 lg:w-96 shrink-0">
                            <ImageCarousel
                              images={tour.images}
                              alt={tour.title[lang]}
                            />
                          </div>

                          {/* Tour info */}
                          <div className="flex-1 min-w-0 space-y-4">
                            <p className="text-sm text-white/70 leading-relaxed">
                              {tour.description[lang]}
                            </p>

                            {/* Price & duration */}
                            <div className="flex flex-wrap gap-4">
                              <div className="glass rounded-lg px-4 py-2.5">
                                <span className="text-xs text-white/40 block">{t('charter')}</span>
                                <span className="text-lg font-bold text-gold-400">
                                  ¥{tour.priceCharter.toLocaleString()}
                                </span>
                              </div>
                              {tour.pricePerPerson && (
                                <div className="glass rounded-lg px-4 py-2.5">
                                  <span className="text-xs text-white/40 block">{t('perPerson')}</span>
                                  <span className="text-lg font-semibold text-white/80">
                                    ¥{tour.pricePerPerson.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="glass rounded-lg px-4 py-2.5">
                                <span className="text-xs text-white/40 block">{t('duration')}</span>
                                <span className="text-sm font-medium text-white/80">
                                  {tour.durationLabel[lang]}
                                </span>
                              </div>
                            </div>

                            {/* Includes */}
                            <div>
                              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">
                                {t('includes')}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {tour.includes[lang].map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs text-white/60 bg-white/5 rounded-full px-3 py-1"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* CTA */}
                            <Link
                              href={`/tours/${category.slug}/${tour.slug}`}
                              className="inline-block rounded-full bg-teal-500 px-6 py-2.5 text-sm font-semibold text-ocean-900 hover:bg-teal-400 transition-colors"
                            >
                              {tConsult('submit')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
