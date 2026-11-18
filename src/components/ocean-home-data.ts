/**
 * OCEAN 시안 콘텐츠 데이터 (시안 전용, 한국어 우선).
 * 실제 승격 시 next-intl 메시지 + 어드민 오버라이드로 이관 권장.
 * 이미지는 현재 public/images 의 SVG 플레이스홀더 — 실제 수중 사진으로 교체 전제.
 */

/**
 * Hero(홈 첫 화면) 기본 텍스트 — 어드민 hero 오버라이드(eyebrow/title/subtitle)가
 * 비어 있을 때의 기본값. 제목·부제는 줄바꿈(\n)으로 여러 줄을 표현하며,
 * 제목은 줄이 2개 이상이면 마지막 줄을 강조색(오션)으로 렌더한다.
 */
export const HERO_DEFAULTS = {
  eyebrow: 'OKINAWA · OCEAN LIFE',
  title: '바다가 시작되는 곳,\n오키나와',
  subtitle: '스쿠버다이빙 · PADI 교육 · 낚시.\n초보자도 안심하는 소수정예 프라이빗 오션 투어.'
} as const;

/** 하위 투어 참조 — slug(상세 페이지 URL·콘텐츠 키)와 표시명. */
export type TourRef = { slug: string; name: string };

export type Activity = {
  id: 'diving' | 'padi' | 'fishing' | 'snorkeling' | 'yacht';
  no: string;
  kicker: string;
  title: string;
  tagline: string;
  desc: string;
  /** 하위 투어 메뉴 (실제 예약 상품). 각 항목은 /tours/{slug} 상세 페이지로 연결. */
  tours: TourRef[];
  image: string;
  /** 카드 글로우/포인트 색 */
  accent: string;
};

export const ACTIVITIES: Activity[] = [
  {
    id: 'snorkeling',
    no: '01',
    kicker: 'SNORKELING',
    title: '스노클링',
    tagline: '온 가족이 함께, 수면 위 산호 정원',
    desc: '구명조끼와 가이드가 늘 함께해 아이도 어르신도 안심. 푸른동굴의 신비한 빛과 산호초, 열대어를 수면에서 만나는 가장 쉬운 바다 체험입니다.',
    tours: [{ slug: 'blue-cave-snorkeling', name: '푸른동굴 스노클링' }],
    image: '/images/ph-2.svg',
    accent: '#93c5fd'
  },
  {
    id: 'diving',
    no: '02',
    kicker: 'SCUBA DIVING',
    title: '스쿠버다이빙',
    tagline: '숨을 멈추고, 푸른 심연으로',
    desc: '자격증이 없어도 전문 강사가 1:2로 동행합니다. 푸른동굴의 신비한 빛부터 케라마 블루의 투명함까지, 오키나와 대표 포인트를 보트로 누비세요.',
    tours: [
      { slug: 'blue-cave-dive', name: '푸른동굴 보트 체험다이빙' },
      { slug: 'kerama-dive', name: '케라마 보트 체험다이빙' },
      { slug: 'fun-dive', name: '펀다이빙' }
    ],
    image: '/images/ph-1.svg',
    accent: '#3b82f6'
  },
  {
    id: 'padi',
    no: '03',
    kicker: 'PADI COURSES',
    title: 'PADI 교육',
    tagline: '평생 함께할 다이버 자격증',
    desc: '국제 공인 PADI 강사진이 한국어로 진행합니다. 첫 자격증부터 전문 스페셜티까지, 단계별로 안전하게 성장하세요.',
    tours: [
      { slug: 'ow-course', name: '오픈워터 라이센스 코스' },
      { slug: 'aow-course', name: '어드밴스드 라이센스 코스' },
      { slug: 'owaow-course', name: 'OW+AOW 연속교육 코스' },
      { slug: 'specialty-course', name: '스페셜티 라이센스 코스' }
    ],
    image: '/images/ph-4.svg',
    // 브랜드 스카이블루 — 터콰이즈(#2dd4bf)는 팔레트 결정(2026-06-04, 포카리)상 사용 금지
    accent: '#5fc6ef'
  },
  {
    id: 'fishing',
    no: '04',
    kicker: 'FISHING TOURS',
    title: '낚시',
    tagline: '오키나와의 손맛, 트로피컬 게임피싱',
    desc: '쿠로시오 난류가 키운 풍성한 어장. 가볍게 즐기는 체험낚시부터 만새기를 노리는 빅게임 트롤링까지, 장비·미끼는 전부 포함입니다.',
    tours: [
      { slug: 'trial-fishing-4h', name: '4시간 체험낚시' },
      { slug: 'fishing-5species-6h', name: '6시간 5종낚시' },
      { slug: 'overnight-fishing', name: '1박2일 종일낚시' },
      { slug: 'biggame-trolling-8h', name: '8시간 빅게임 트롤링' }
    ],
    image: '/images/ph-3.svg',
    accent: '#f6a623'
  },
  {
    id: 'yacht',
    no: '05',
    kicker: 'YACHT CRUISING',
    title: '요트 크루징',
    tagline: '오키나와 블루를 가르는 프라이빗 요트',
    desc: '에메랄드빛 케라마 해역을 전세 요트로 누비는 프리미엄 크루징. 선셋·스노클링·온보드 다이닝까지, 일행만을 위한 프라이빗한 하루를 설계합니다.',
    tours: [
      { slug: 'luxury-yacht-cruise', name: '럭셔리 클래스 투어' },
      { slug: 'middle-yacht-cruise', name: '미들 클래스 투어' }
    ],
    image: '/images/ph-5.svg',
    accent: '#d4b878'
  }
];

export type Stat = { value: string; label: string };

export const STATS: Stat[] = [
  { value: '12,000+', label: '누적 게스트' },
  { value: '10년', label: '무사고 운영' },
  { value: '4.9', label: '평균 평점 (5.0)' },
  { value: '3개국어', label: '한 · 영 · 일 가이드' }
];

export type Assurance = { title: string; desc: string };

/**
 * 신뢰 섹션 — 왜 우리인가(어드민 입력 전 기본값, messages ocean.assurance* 와 같은 내용).
 * 보험·무료 픽업·인원 상한은 적지 않는다 — 픽업·보험은 상담으로만 안내(2026-11-18 원님 결정),
 * 인원은 가이드 1명당 최대 8명이고 전체 인원 제한은 없다.
 */
export const ASSURANCES: Assurance[] = [
  {
    title: '소수정예 / 프라이빗',
    desc: '적은 그룹 구성으로 쾌적한 투어를 추구하며, 우리 팀만의 완전 단독 프라이빗 투어도 가능합니다.'
  },
  {
    title: '청결하고 안전한 장비',
    desc: '매일 투어가 끝나면 세척과 소독은 기본! 항상 관리가 잘 된 장비를 제공합니다.'
  },
  {
    title: '의사소통 문제 제로',
    desc: '한국어·영어·일본어 모두 대응합니다. 예약부터 브리핑, 투어 후 배웅까지 원하시는 언어로 진행합니다.'
  },
  {
    title: '무료 사진 제공',
    desc: '투어 중 촬영한 수중 사진 원본을 투어 종료 후 보내드립니다. 프리미엄 사진 서비스는 투어 전에 문의해 주세요.'
  }
];

/** 갤러리 마퀴 — 두 줄로 흐름. 실제 사진 6~10장으로 교체 전제. */
export const GALLERY: string[] = [
  '/images/ph-1.svg',
  '/images/ph-2.svg',
  '/images/ph-3.svg',
  '/images/ph-4.svg',
  '/images/ph-5.svg',
  '/images/hero-placeholder.svg'
];
