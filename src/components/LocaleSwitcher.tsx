'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, routing, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'EN',
  ja: '日本語'
};

export default function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    startTransition(() => {
      // next-intl navigation은 현재 경로를 대상 로케일로 유지하며 전환한다.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-1" aria-label="언어 선택">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => onSelect(loc)}
          disabled={isPending}
          aria-current={loc === current ? 'true' : undefined}
          className={`px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] transition-colors disabled:opacity-50 ${
            loc === current
              ? 'bg-brand text-brand-contrast'
              : 'text-muted hover:text-ink'
          }`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
