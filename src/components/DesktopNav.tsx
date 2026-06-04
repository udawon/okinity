'use client';

import { Fragment, useRef, useState, useId, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { NAV, type NavItem } from '@/config/nav.config';

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavDropdown({ item }: { item: NavItem }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // 포커스가 항목(버튼+메뉴) 바깥으로 나가면 닫기 — 키보드 탭아웃 대응
  const onBlur = (e: React.FocusEvent<HTMLLIElement>) => {
    if (!liRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      // 다음 프레임에 첫 메뉴 항목으로 포커스
      requestAnimationFrame(() => {
        liRef.current?.querySelector<HTMLAnchorElement>('[role="menuitem"]')?.focus();
      });
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  return (
    <li
      ref={liRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={onBlur}
    >
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-1 py-2 transition-colors hover:text-white aria-expanded:text-white"
      >
        {t(item.key)}
        <Caret open={open} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t(item.key)}
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 top-full min-w-[15rem] pt-3"
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#061522]/95 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
            {item.children!.map((leaf) => (
              <Link
                key={leaf.tKey}
                href={leaf.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white focus:outline-none"
              >
                {t(leaf.tKey)}
              </Link>
            ))}
            {item.hub && (
              <Link
                href={item.hub}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-1.5 border-t border-white/10 px-4 pb-1 pt-3 text-xs font-semibold text-brand transition-colors hover:text-white focus:text-white focus:outline-none"
              >
                {t('viewAll')}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function DesktopNav() {
  const t = useTranslations('nav');
  return (
    <nav className="hidden xl:block" aria-label="주요 메뉴">
      <ul className="flex items-center gap-6 text-sm font-medium text-white/70">
        {NAV.map((item) => (
          <Fragment key={item.key}>
            {item.children ? (
              <NavDropdown item={item} />
            ) : (
              <li>
                <Link href={item.href} className="py-2 transition-colors hover:text-white">
                  {t(item.key)}
                </Link>
              </li>
            )}
            {item.groupEnd && (
              <li aria-hidden className="h-4 w-px self-center bg-white/20" />
            )}
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
