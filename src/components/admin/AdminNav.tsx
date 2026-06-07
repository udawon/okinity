'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = { href: string; label: string; group: 'schedule' | 'content' };

const TABS: Tab[] = [
  // 일정 관리
  { href: '/admin', label: '예약 관리', group: 'schedule' },
  { href: '/admin/board', label: '운영 보드', group: 'schedule' },
  { href: '/admin/schedule', label: '일정·휴무', group: 'schedule' },
  // 콘텐츠
  { href: '/admin/content', label: '콘텐츠 편집', group: 'content' },
  { href: '/admin/about', label: '소개', group: 'content' },
  { href: '/admin/tours', label: '투어 상세', group: 'content' },
  { href: '/admin/notice', label: '공지사항', group: 'content' },
  { href: '/admin/blog', label: '블로그', group: 'content' }
];

/** 어드민 상단 탭. 일정 관리 ↔ 콘텐츠 그룹을 구분선으로 묶는다. (/admin 은 [locale] 밖이라 next/link) */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-stretch gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t, i) => {
        // /admin 은 정확 일치만, 그 외엔 하위 경로(편집 페이지 등) 포함.
        const active = t.href === '/admin' ? pathname === '/admin' : pathname.startsWith(t.href);
        const groupChanged = i > 0 && TABS[i - 1].group !== t.group;
        return (
          <span key={t.href} className="flex items-stretch">
            {groupChanged && <span className="my-2 w-px shrink-0 bg-line" aria-hidden />}
            <Link
              href={t.href}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
