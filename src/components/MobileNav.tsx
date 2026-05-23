'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, type Locale } from '@/i18n/routing';
import LocaleSwitcher from './LocaleSwitcher';

const ITEMS = [
  { href: '/about', key: 'about' },
  { href: '/diving', key: 'diving' },
  { href: '/padi', key: 'padi' },
  { href: '/schedule', key: 'schedule' },
  { href: '/gallery', key: 'gallery' },
  { href: '/contact', key: 'contact' }
] as const;

export default function MobileNav({ current }: { current: Locale }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center text-ink"
      >
        <span className="font-mono text-lg">{open ? '✕' : '≡'}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-line bg-bg sm:top-[111px]">
          <nav className="flex flex-col px-5 py-4 font-mono text-sm uppercase tracking-[0.1em] text-ink">
            {ITEMS.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 last:border-0 hover:text-brand-dark"
              >
                {t(it.key)}
              </Link>
            ))}
            <div className="pt-4">
              <LocaleSwitcher current={current} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
