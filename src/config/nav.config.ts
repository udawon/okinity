/**
 * 헤더 내비게이션 단일 출처 — 데스크탑(DesktopNav)·모바일(MobileNav) 공용.
 * 라벨은 next-intl `nav` 네임스페이스 키로 참조(messages/{ko,en,ja}.json).
 *
 * 하위 투어 상세 페이지는 아직 없으므로 leaf.href 는 임시로 '/contact'(예약 문의).
 * 투어 상세 라우트가 생기면 여기 href 만 교체하면 된다.
 */

export type NavLeaf = {
  /** nav 하위 번역 키 (예: 'tours.diving.cave') */
  tKey: string;
  href: string;
};

export type NavItem = {
  /** nav 번역 키 (예: 'diving') */
  key: string;
  href: string;
  /** 드롭다운 "전체 보기" 대상(카테고리 허브 페이지). 없으면 미표시 */
  hub?: string;
  children?: NavLeaf[];
  /** 이 항목 뒤에 그룹 구분선을 그린다(헤더 시각 그룹핑). */
  groupEnd?: boolean;
};

export const NAV: NavItem[] = [
  { key: 'about', href: '/about', groupEnd: true },
  {
    key: 'snorkeling',
    href: '/tours/blue-cave-snorkeling',
    children: [
      { tKey: 'tours.snorkeling.cave', href: '/tours/blue-cave-snorkeling' },
      { tKey: 'tours.snorkeling.boat', href: '/tours/boat-snorkeling' },
      { tKey: 'tours.snorkeling.beach', href: '/tours/beach-snorkeling' }
    ]
  },
  {
    key: 'diving',
    href: '/diving',
    hub: '/diving',
    children: [
      { tKey: 'tours.diving.cave', href: '/tours/blue-cave-dive' },
      { tKey: 'tours.diving.kerama', href: '/tours/kerama-dive' },
      { tKey: 'tours.diving.fun', href: '/tours/fun-dive' }
    ]
  },
  {
    key: 'padi',
    href: '/padi',
    hub: '/padi',
    children: [
      { tKey: 'tours.padi.ow', href: '/tours/ow-course' },
      { tKey: 'tours.padi.aow', href: '/tours/aow-course' },
      { tKey: 'tours.padi.owaow', href: '/tours/owaow-course' },
      { tKey: 'tours.padi.specialty', href: '/tours/specialty-course' }
    ]
  },
  {
    key: 'fishing',
    href: '/tours/trial-fishing-4h',
    groupEnd: true,
    children: [
      { tKey: 'tours.fishing.trial4', href: '/tours/trial-fishing-4h' },
      { tKey: 'tours.fishing.five6', href: '/tours/fishing-5species-6h' },
      { tKey: 'tours.fishing.overnight', href: '/tours/overnight-fishing' },
      { tKey: 'tours.fishing.biggame8', href: '/tours/biggame-trolling-8h' }
    ]
  },
  { key: 'notice', href: '/notice' },
  { key: 'schedule', href: '/reserve' },
  { key: 'blog', href: '/blog' }
];
