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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8.5 14 2.2 2.2L15.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MobileNav({ current }: { current: Locale }) {
  const t = useTranslations('nav');
  const tr = useTranslations('reservation');
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
        <div className="absolute left-0 right-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 bg-[#061522]/95 backdrop-blur-md sm:top-[111px]">
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

            <div className="pt-4">
              <LocaleSwitcher current={current} />
            </div>

            {/* 핵심 전환 CTA — 언어 선택 아래에 강조 배치 */}
            <Link
              href="/reserve"
              onClick={close}
              className="group mt-4 flex items-center gap-3 rounded-2xl bg-brand px-4 py-3.5 text-brand-contrast shadow-[0_10px_28px_rgba(12,139,208,0.4)] transition-[transform,background-color] duration-200 hover:bg-brand-dark active:scale-[0.98]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold leading-tight">{t('contact')}</span>
                <span className="mt-0.5 block text-[12px] font-medium leading-tight text-white/70">
                  {tr('menuCtaSub')}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
