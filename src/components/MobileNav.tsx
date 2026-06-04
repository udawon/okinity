'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, type Locale } from '@/i18n/routing';
import { NAV } from '@/config/nav.config';
import LocaleSwitcher from './LocaleSwitcher';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MobileNav({ current }: { current: Locale }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => {
    setOpen(false);
    setExpanded(null);
  };

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-label="메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center text-white"
      >
        <MenuIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-[#06151d]/95 backdrop-blur-md sm:top-[111px]">
          <nav className="flex flex-col px-5 py-4 text-sm font-medium text-white/80" aria-label="주요 메뉴">
            {NAV.map((item) =>
              item.children ? (
                <div key={item.key} className="border-b border-white/10">
                  <button
                    type="button"
                    aria-expanded={expanded === item.key}
                    onClick={() => setExpanded((v) => (v === item.key ? null : item.key))}
                    className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-white"
                  >
                    {t(item.key)}
                    <Caret open={expanded === item.key} />
                  </button>
                  {expanded === item.key && (
                    <ul className="pb-2">
                      {item.children.map((leaf) => (
                        <li key={leaf.tKey}>
                          <Link
                            href={leaf.href}
                            onClick={close}
                            className="block py-2.5 pl-3 text-[13px] text-white/65 transition-colors hover:text-white"
                          >
                            {t(leaf.tKey)}
                          </Link>
                        </li>
                      ))}
                      {item.hub && (
                        <li>
                          <Link
                            href={item.hub}
                            onClick={close}
                            className="block py-2.5 pl-3 text-[13px] font-semibold text-brand transition-colors hover:text-white"
                          >
                            {t('viewAll')}
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={close}
                  className="border-b border-white/10 py-3 transition-colors hover:text-white"
                >
                  {t(item.key)}
                </Link>
              )
            )}

            <Link
              href="/reserve"
              onClick={close}
              className="border-b border-white/10 py-3 transition-colors hover:text-white last:border-0"
            >
              {t('contact')}
            </Link>

            <div className="pt-4">
              <LocaleSwitcher current={current} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
