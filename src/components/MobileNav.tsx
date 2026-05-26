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
        className="flex h-9 w-9 items-center justify-center text-white"
      >
        <span className="text-lg">{open ? '✕' : '≡'}</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-white/10 bg-[#06151d]/95 backdrop-blur-md sm:top-[111px]">
          <nav className="flex flex-col px-5 py-4 text-sm font-medium text-white/80">
            {ITEMS.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-3 transition-colors last:border-0 hover:text-white"
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
