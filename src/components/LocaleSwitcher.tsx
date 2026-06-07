'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, routing, type Locale } from '@/i18n/routing';

const LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'EN',
  ja: '日本語'
};
// 컴팩트 트리거용 짧은 코드(데스크탑 헤더 폭 절약).
const SHORT: Record<Locale, string> = {
  ko: 'KO',
  en: 'EN',
  ja: 'JA'
};

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/**
 * 언어 전환기.
 * - variant="bar"(기본): 한국어/EN/日本語 3버튼 가로 토글(모바일 메뉴 등 공간 여유 시).
 * - variant="compact": 글로브 + 현재 코드 + 캐럿 → 드롭다운(데스크탑 헤더 폭 절약).
 */
export default function LocaleSwitcher({
  current,
  variant = 'bar'
}: {
  current: Locale;
  variant?: 'bar' | 'compact';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    startTransition(() => {
      // next-intl navigation은 현재 경로를 대상 로케일로 유지하며 전환한다.
      router.replace(pathname, { locale: next });
    });
  }

  if (variant === 'compact') {
    return <CompactSwitcher current={current} isPending={isPending} onSelect={onSelect} />;
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
          className={`whitespace-nowrap rounded-button px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            loc === current
              ? 'bg-brand text-brand-contrast'
              : 'text-white/55 hover:text-white'
          }`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}

function CompactSwitcher({
  current,
  isPending,
  onSelect
}: {
  current: Locale;
  isPending: boolean;
  onSelect: (loc: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // 바깥 클릭 / Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0" aria-label="언어 선택">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-button border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:opacity-50"
      >
        <GlobeIcon className="h-4 w-4" />
        {SHORT[current]}
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="언어 선택"
          className="absolute right-0 top-full mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-white/10 bg-[#061522]/95 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitemradio"
              aria-checked={loc === current}
              onClick={() => {
                onSelect(loc);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-4 py-2 text-sm transition-colors hover:bg-white/5 ${
                loc === current ? 'font-semibold text-brand' : 'text-white/75 hover:text-white'
              }`}
            >
              {LABELS[loc]}
              {loc === current && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m5 12 5 5 9-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
