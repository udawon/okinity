'use client';

import { useEffect, useRef, useState } from 'react';
import { pickActiveSection } from '@/lib/section-spy';

export type TourNavItem = { id: string; label: string };

/**
 * 모바일·태블릿 섹션 탭 — 요약 타일 아래에서 시작해, 스크롤하면 헤더 바로 밑에 붙는다(sticky).
 * 태그처럼 보이던 알약 버튼 대신 밑줄 탭 + 현재 섹션 표시로 "누르면 그 섹션으로 이동"임을 드러낸다.
 * 넘치는 탭은 가로 스크롤 — 양 끝 흐림으로 더 있음을 알리고, 현재 탭은 자동으로 보이는 위치로 옮긴다.
 */
export default function TourSectionNav({ items, label }: { items: TourNavItem[]; label: string }) {
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const [edge, setEdge] = useState({ left: false, right: false });

  // 현재 섹션 추적 — 탭 바 아래 기준선을 지난 마지막 섹션
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const offset = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      const sections = items.flatMap((it) => {
        const el = document.getElementById(it.id);
        return el ? [{ id: it.id, top: el.getBoundingClientRect().top }] : [];
      });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(pickActiveSection(sections, offset, atBottom));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  // 현재 탭이 탭 바 안에서 보이도록 가로 위치 조정(페이지 세로 스크롤은 건드리지 않음)
  useEffect(() => {
    const bar = barRef.current;
    const tab = active ? bar?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
    if (!bar || !tab) return;
    const left = tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  // 양 끝 흐림 — 가로로 더 넘길 탭이 있을 때만
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const check = () =>
      setEdge({ left: bar.scrollLeft > 4, right: bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4 });
    check();
    bar.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      bar.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="sticky top-16 z-30 -mx-5 mt-6 border-b border-white/10 bg-[#061522]/90 backdrop-blur-md sm:top-[111px] sm:-mx-6 lg:hidden"
    >
      <div className="relative">
        <div
          ref={barRef}
          className="flex overflow-x-auto px-2 sm:px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => {
            const on = active === it.id;
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                data-id={it.id}
                aria-current={on ? 'location' : undefined}
                className={`relative shrink-0 px-3 py-3.5 text-[15px] font-semibold transition-colors ${
                  on ? 'text-white' : 'text-white/55 hover:text-white/85'
                }`}
              >
                {it.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-colors ${
                    on ? 'bg-[#5fc6ef]' : 'bg-transparent'
                  }`}
                />
              </a>
            );
          })}
        </div>
        {edge.left && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#061522] to-transparent" />
        )}
        {edge.right && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#061522] to-transparent" />
        )}
      </div>
    </nav>
  );
}
