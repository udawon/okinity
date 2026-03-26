'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { tours } from '@/lib/tours';
import { useParams } from 'next/navigation';

export function ConsultationForm() {
  const t = useTranslations('consultation');
  const { locale } = useParams();
  const lang = (locale as 'ko' | 'ja' | 'en') || 'ko';
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      tourId: formData.get('tourId'),
      customerName: formData.get('customerName'),
      customerEmail: formData.get('customerEmail'),
      preferredContact: formData.get('preferredContact'),
      contactId: formData.get('contactId'),
      preferredDate: formData.get('preferredDate'),
      partySize: formData.get('partySize'),
      message: formData.get('message') || '',
      language: lang,
    };

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError(lang === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : lang === 'ja' ? 'エラーが発生しました。もう一度お試しください。' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section id="consultation" className="py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-12"
          >
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg text-teal-400">{t('success')}</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              {lang === 'ko' ? '새로운 상담 신청' : lang === 'ja' ? '新しいご相談' : 'New Inquiry'}
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="consultation" className="py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('title')}</h2>
          <p className="mt-4 text-white/50">{t('subtitle')}</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                {t('name')}
              </label>
              <input
                type="text"
                name="customerName"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                name="customerEmail"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Preferred contact */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              {t('preferredContact')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['kakao', 'line', 'emailContact', 'phoneContact'] as const).map(
                (method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 cursor-pointer hover:border-white/20 transition-colors has-[:checked]:border-teal-500 has-[:checked]:bg-teal-500/10"
                  >
                    <input
                      type="radio"
                      name="preferredContact"
                      value={method}
                      defaultChecked={method === 'kakao'}
                      className="sr-only"
                    />
                    <span className="text-sm text-white/80">{t(method)}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Contact ID */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              {t('contactId')}
            </label>
            <input
              type="text"
              name="contactId"
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Tour, Date, Party size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                {t('tour')}
              </label>
              <select
                name="tourId"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="" className="bg-ocean-900">
                  {t('selectTour')}
                </option>
                {tours.map((tour) => (
                  <option
                    key={tour.id}
                    value={tour.id}
                    className="bg-ocean-900"
                  >
                    {tour.title[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                {t('date')}
              </label>
              <input
                type="date"
                name="preferredDate"
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                {t('partySize')}
              </label>
              <input
                type="number"
                name="partySize"
                min={1}
                max={15}
                defaultValue={2}
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              {t('message')}
            </label>
            <textarea
              name="message"
              rows={3}
              placeholder={t('messagePlaceholder')}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            className="w-full rounded-full bg-teal-500 py-3.5 text-sm font-semibold text-ocean-900 hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('submit')}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}
