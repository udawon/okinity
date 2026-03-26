'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

const features = [
  { key: 'premium', icon: '✦' },
  { key: 'location', icon: '◎' },
  { key: 'custom', icon: '◈' },
] as const;

export function WhySection() {
  const t = useTranslations('why');

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {t('title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="text-3xl text-teal-400 mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-3">
                {t(`${f.key}.title`)}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {t(`${f.key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
