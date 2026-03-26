import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-white/50 mb-12">{t('subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <a
            href="https://instagram.com/okinity_official"
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-2xl p-8 hover:border-white/20 transition-all group"
          >
            <div className="text-3xl mb-3">📷</div>
            <h3 className="font-medium group-hover:text-teal-400 transition-colors">
              {t('instagram')}
            </h3>
            <p className="text-sm text-white/40 mt-1">@okinity_official</p>
          </a>

          <div className="glass rounded-2xl p-8">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-medium">{t('kakao')}</h3>
            <p className="text-sm text-white/40 mt-1">QR Code</p>
          </div>

          <a
            href="mailto:contact@okinity.com"
            className="glass rounded-2xl p-8 hover:border-white/20 transition-all group"
          >
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="font-medium group-hover:text-teal-400 transition-colors">
              {t('email')}
            </h3>
            <p className="text-sm text-white/40 mt-1">contact@okinity.com</p>
          </a>
        </div>
      </div>
    </div>
  );
}
