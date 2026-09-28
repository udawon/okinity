'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOUR_CATALOG } from '@/lib/tour';

type Item = { href: string; label: string; sub?: string; icon: keyof typeof ICONS };

/** 메뉴 — 매일 쓰는 '운영'과 가끔 고치는 '콘텐츠'로 나눈다. */
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: '운영',
    items: [
      { href: '/admin', label: '오늘', icon: 'home' },
      { href: '/admin/reservations', label: '예약 관리', icon: 'inbox' },
      { href: '/admin/board', label: '운영 보드', icon: 'board' },
      { href: '/admin/schedule', label: '일정 · 휴무', icon: 'calendar' },
      { href: '/admin/tour-times', label: '투어 시간대', icon: 'clock' }
    ]
  },
  {
    title: '콘텐츠',
    items: [
      { href: '/admin/content', label: '홈 화면', sub: '사이트 편집', icon: 'layout' },
      { href: '/admin/tours', label: '투어 상세', sub: String(TOUR_CATALOG.length), icon: 'compass' },
      { href: '/admin/tour-notices', label: '공통 안내', sub: '환불 · 안전', icon: 'shield' },
      { href: '/admin/blog', label: '블로그', sub: '투어 기록', icon: 'camera' },
      { href: '/admin/notice', label: '공지사항', icon: 'mega' },
      { href: '/admin/about', label: '소개', icon: 'info' }
    ]
  }
];

const ICONS = {
  home: <path d="M3 11l9-7 9 7v9H3zM9 20v-6h6v6" />,
  inbox: <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5" />,
  board: <path d="M4 4h16v16H4zM4 9h16M9 9v11" />,
  calendar: <path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" />,
  clock: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2" />,
  layout: <path d="M3 4h18v16H3zM3 10h18M9 10v10" />,
  compass: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />,
  mega: <path d="M3 10v4h4l6 4V6L7 10zM17 9a4 4 0 0 1 0 6" />,
  info: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8v.01" />
};

function isActive(pathname: string, href: string): boolean {
  // /admin 은 정확 일치만, 그 외엔 하위 경로(편집 페이지 등) 포함.
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 어드민 메뉴 — 데스크톱은 왼쪽 세로 사이드바, 모바일은 상단 가로 스크롤 메뉴.
 * (/admin 은 [locale] 밖이라 next/link)
 */
export default function AdminNav({ variant }: { variant: 'side' | 'bar' }) {
  const pathname = usePathname();

  if (variant === 'bar') {
    return (
      <nav aria-label="관리자 메뉴" className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GROUPS.flatMap((g) => g.items).map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-button px-3.5 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-brand text-brand-contrast' : 'text-muted hover:bg-bg hover:text-ink'
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="관리자 메뉴" className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 text-xs font-bold tracking-wider text-muted">{g.title}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                      active ? 'bg-brand/10 font-bold text-brand' : 'text-ink hover:bg-bg'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="h-[18px] w-[18px] shrink-0"
                    >
                      {ICONS[it.icon]}
                    </svg>
                    <span className="flex-1">{it.label}</span>
                    {it.sub && <span className="text-xs font-normal text-muted">{it.sub}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
