'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from './language-switcher';

export function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-nav' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wider text-white">
            OKINITY
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            {t('home')}
          </Link>
          <Link
            href="/#tours"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            {t('tours')}
          </Link>
          <Link
            href="/contact"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            {t('contact')}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/#consultation"
            className="rounded-full bg-teal-500 px-5 py-2 text-sm font-medium text-ocean-900 hover:bg-teal-400 transition-colors"
          >
            {t('consultation')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2"
          aria-label="Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-nav overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <Link href="/" className="text-white/80 hover:text-white">
                {t('home')}
              </Link>
              <Link href="/#tours" className="text-white/80 hover:text-white">
                {t('tours')}
              </Link>
              <Link href="/contact" className="text-white/80 hover:text-white">
                {t('contact')}
              </Link>
              <LanguageSwitcher />
              <Link
                href="/#consultation"
                className="rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-ocean-900 text-center hover:bg-teal-400"
              >
                {t('consultation')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
