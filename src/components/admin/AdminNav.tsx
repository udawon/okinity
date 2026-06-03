'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: '예약 관리' },
  { href: '/admin/board', label: '운영 보드' },
  { href: '/admin/content', label: '콘텐츠 편집' },
  { href: '/admin/about', label: '소개' },
  { href: '/admin/tours', label: '투어 상세' },
  { href: '/admin/blog', label: '블로그' },
  { href: '/admin/notice', label: '공지사항' }
];

/** 어드민 상단 탭. (/admin 은 [locale] 밖이라 next/link 사용) */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => {
        // /admin 은 정확 일치만, 그 외엔 하위 경로(편집 페이지 등) 포함.
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? 'border-brand text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
