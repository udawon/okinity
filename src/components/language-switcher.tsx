'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';

const localeLabels: Record<string, string> = {
  ko: '한국어',
  ja: '日本語',
  en: 'EN',
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'ko';

  function switchLocale(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(localeLabels).map(([locale, label]) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            currentLocale === locale
              ? 'bg-white/15 text-white font-medium'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
