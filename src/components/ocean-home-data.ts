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
  id: 'diving' | 'padi' | 'fishing' | 'snorkeling';
  no: string;
  kicker: string;
  title: string;
  tagline: string;
  desc: string;
  /** 하위 투어 메뉴 (실제 예약 상품). 각 항목은 /tours/{slug} 상세 페이지로 연결. */
  tours: TourRef[];
  meta: { label: string; value: string }[];
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
    tours: [
      { slug: 'blue-cave-snorkeling', name: '푸른동굴 스노클링' },
      { slug: 'boat-snorkeling', name: '보트 스노클링' },
      { slug: 'beach-snorkeling', name: '스노클링' }
    ],
    meta: [
      { label: '수심', value: '0–3m' },
      { label: '소요', value: '2–3시간' },
      { label: '대상', value: '입문 · 가족' }
    ],
    image: '/images/ph-2.svg',
    accent: '#5fd6e2'
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
    meta: [
      { label: '수심', value: '5–18m' },
      { label: '소요', value: '반일 · 종일' },
      { label: '대상', value: '입문~상급' }
    ],
    image: '/images/ph-1.svg',
    accent: '#22d3ee'
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
    meta: [
      { label: '기간', value: '2–4일' },
      { label: '인증', value: '국제 PADI' },
      { label: '대상', value: '입문~전문' }
    ],
    image: '/images/ph-4.svg',
    accent: '#38bdf8'
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
    meta: [
      { label: '시간', value: '4시간~1박2일' },
      { label: '포함', value: '장비 · 미끼' },
      { label: '대상', value: '누구나' }
    ],
    image: '/images/ph-3.svg',
    accent: '#f6a623'
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

/** 신뢰 섹션 — 왜 우리인가 */
export const ASSURANCES: Assurance[] = [
  {
    title: '소수정예 프라이빗',
    desc: '한 팀 최대 6명. 강사가 모든 게스트의 호흡을 끝까지 케어합니다.'
  },
  {
    title: 'PADI 공인 · 보험 완비',
    desc: '국제 인증 강사진과 전 게스트 다이빙 상해보험으로 안전을 보장합니다.'
  },
  {
    title: '한국어로 편하게',
    desc: '예약부터 브리핑, 수중 사인까지 한국어 가이드가 동행합니다.'
  },
  {
    title: '무료 사진 · 픽업',
    desc: '수중 인생샷 원본 제공, 주요 숙소 무료 픽업 서비스를 포함합니다.'
  }
];

export type Testimonial = { quote: string; name: string; city: string; tour: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      '처음 다이빙이었는데 강사님이 끝까지 손을 잡아 주셔서 하나도 안 무서웠어요. 푸른동굴 빛이 정말 환상적이었습니다!',
    name: '김지은',
    city: '서울',
    tour: '푸른동굴 체험다이빙'
  },
  {
    quote:
      '오픈워터 자격증을 한국어로 차근차근 배웠어요. 이론부터 바다 실습까지 안전 케어가 정말 꼼꼼했습니다.',
    name: '박상현',
    city: '부산',
    tour: 'PADI 오픈워터 코스'
  },
  {
    quote:
      '빅게임 트롤링 갔다가 만새기 네 마리! 선상에서 바로 회로 떠 주셔서 잊지 못할 하루였어요.',
    name: '이도윤',
    city: '대구',
    tour: '8시간 빅게임 트롤링'
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
