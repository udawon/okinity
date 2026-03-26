'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/okinawa_ship.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="video-overlay absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-wider">
            OKINITY
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light tracking-wide">
            {t('subtitle')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <motion.a
              href="#tours"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              {t('cta')}
            </motion.a>
            <motion.a
              href="#consultation"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-teal-500 px-8 py-3 text-sm font-medium text-ocean-900 hover:bg-teal-400 transition-colors"
            >
              {t('ctaConsult')}
            </motion.a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
