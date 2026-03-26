export interface Tour {
  id: string;
  slug: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
  category: 'cruise' | 'business' | 'filming' | 'festival' | 'party' | 'proposal';
  priceCharter: number;
  pricePerPerson: number | null;
  minPersons: number;
  maxPersons: number;
  durationMinutes: number;
  durationLabel: { ko: string; ja: string; en: string };
  includes: { ko: string[]; ja: string[]; en: string[] };
  image: string;
  available: boolean;
}

export const tours: Tour[] = [
  {
    id: '1',
    slug: 'private-cruise',
    title: {
      ko: '프라이빗 크루즈',
      ja: 'プライベートクルーズ',
      en: 'Private Cruise',
    },
    description: {
      ko: '소수인원 전용 프라이빗 요트로 오키나와의 에메랄드빛 바다를 만끽하세요. 웰컴드링크와 핑거푸드가 포함된 특별한 크루즈 경험.',
      ja: '少人数専用プライベートヨットで沖縄のエメラルドグリーンの海を満喫。ウェルカムドリンクとフィンガーフードが含まれた特別なクルーズ体験。',
      en: 'Enjoy Okinawa\'s emerald waters on a private yacht for intimate groups. Includes welcome drinks and finger food for a truly special cruise experience.',
    },
    category: 'cruise',
    priceCharter: 300000,
    pricePerPerson: 35000,
    minPersons: 6,
    maxPersons: 10,
    durationMinutes: 240,
    durationLabel: { ko: '약 4시간', ja: '約4時間', en: 'Approx. 4 hours' },
    includes: {
      ko: ['웰컴드링크 1잔', '스낵', '간단한 핑거푸드', '추가 음료 판매'],
      ja: ['ウェルカムドリンク1杯', 'スナック', 'フィンガーフード', '追加ドリンク販売'],
      en: ['Welcome drink', 'Snacks', 'Finger food', 'Additional drinks available'],
    },
    image: '/images/cruise.jpg',
    available: true,
  },
  {
    id: '2',
    slug: 'vip-business',
    title: {
      ko: 'VIP 비즈니스',
      ja: 'VIPビジネス',
      en: 'VIP Business',
    },
    description: {
      ko: '바다 위에서 진행하는 특별한 비즈니스 미팅. 프라이빗한 공간에서 중요한 파트너와의 만남을 더욱 인상적으로.',
      ja: '海の上で行う特別なビジネスミーティング。プライベート空間で重要なパートナーとの出会いをより印象的に。',
      en: 'Exclusive business meetings on the water. Make a lasting impression with key partners in a private setting.',
    },
    category: 'business',
    priceCharter: 500000,
    pricePerPerson: null,
    minPersons: 2,
    maxPersons: 10,
    durationMinutes: 180,
    durationLabel: { ko: '약 3시간', ja: '約3時間', en: 'Approx. 3 hours' },
    includes: {
      ko: ['프리미엄 음료', '케이터링', '전용 공간', '프레젠테이션 장비'],
      ja: ['プレミアムドリンク', 'ケータリング', '専用空間', 'プレゼン設備'],
      en: ['Premium drinks', 'Catering', 'Private space', 'Presentation equipment'],
    },
    image: '/images/business.jpg',
    available: true,
  },
  {
    id: '3',
    slug: 'mv-filming',
    title: {
      ko: 'MV/영화 촬영',
      ja: 'MV・映画撮影',
      en: 'MV/Film Shooting',
    },
    description: {
      ko: '오키나와의 아름다운 해상 배경에서 뮤직비디오, 영화, 화보 촬영. 최적의 촬영 포인트와 전문 서포트를 제공합니다.',
      ja: '沖縄の美しい海を背景にミュージックビデオ、映画、グラビア撮影。最適な撮影ポイントと専門サポートをご提供。',
      en: 'Shoot music videos, films, and photo spreads against Okinawa\'s stunning seascape. We provide optimal shooting locations and professional support.',
    },
    category: 'filming',
    priceCharter: 600000,
    pricePerPerson: null,
    minPersons: 1,
    maxPersons: 15,
    durationMinutes: 480,
    durationLabel: { ko: '약 8시간', ja: '約8時間', en: 'Approx. 8 hours' },
    includes: {
      ko: ['전용 요트', '촬영 포인트 가이드', '음료 및 식사', '장비 반입 지원'],
      ja: ['専用ヨット', '撮影ポイントガイド', 'ドリンク・食事', '機材搬入サポート'],
      en: ['Private yacht', 'Location guide', 'Drinks & meals', 'Equipment loading support'],
    },
    image: '/images/filming.jpg',
    available: true,
  },
  {
    id: '4',
    slug: 'fireworks-festival',
    title: {
      ko: '불꽃축제 관람',
      ja: '花火大会観覧',
      en: 'Fireworks Festival',
    },
    description: {
      ko: '오키나와 최대 불꽃축제를 바다 위 특별석에서! 1만발의 불꽃을 오직 당신만을 위한 프라이빗 요트에서 감상하세요.',
      ja: '沖縄最大の花火大会を海上の特別席から！1万発の花火をプライベートヨットからお楽しみください。',
      en: 'Watch Okinawa\'s biggest fireworks festival from a private VIP seat on the sea! 10,000 fireworks just for you.',
    },
    category: 'festival',
    priceCharter: 300000,
    pricePerPerson: 35000,
    minPersons: 6,
    maxPersons: 10,
    durationMinutes: 240,
    durationLabel: { ko: '약 4시간', ja: '約4時間', en: 'Approx. 4 hours' },
    includes: {
      ko: ['웰컴드링크 1잔', '스낵', '간단한 핑거푸드', '추가 음료 판매'],
      ja: ['ウェルカムドリンク1杯', 'スナック', 'フィンガーフード', '追加ドリンク販売'],
      en: ['Welcome drink', 'Snacks', 'Finger food', 'Additional drinks available'],
    },
    image: '/images/fireworks.jpg',
    available: true,
  },
  {
    id: '5',
    slug: 'private-party',
    title: {
      ko: '프라이빗 파티',
      ja: 'プライベートパーティー',
      en: 'Private Party',
    },
    description: {
      ko: '생일, 기념일, 단체 파티를 바다 위에서! 음악, 음식, 분위기까지 맞춤 세팅으로 잊지 못할 파티를 만들어드립니다.',
      ja: '誕生日、記念日、グループパーティーを海の上で！音楽、料理、雰囲気まで、カスタム設定で忘れられないパーティーを。',
      en: 'Birthdays, anniversaries, group celebrations on the water! Custom setup with music, food, and ambiance for an unforgettable party.',
    },
    category: 'party',
    priceCharter: 400000,
    pricePerPerson: null,
    minPersons: 4,
    maxPersons: 10,
    durationMinutes: 300,
    durationLabel: { ko: '약 5시간', ja: '約5時間', en: 'Approx. 5 hours' },
    includes: {
      ko: ['파티 세팅', '케이터링', '음료', 'DJ 장비 (옵션)'],
      ja: ['パーティーセッティング', 'ケータリング', 'ドリンク', 'DJ機材（オプション）'],
      en: ['Party setup', 'Catering', 'Drinks', 'DJ equipment (optional)'],
    },
    image: '/images/party.jpg',
    available: true,
  },
  {
    id: '6',
    slug: 'proposal',
    title: {
      ko: '프로포즈 이벤트',
      ja: 'プロポーズイベント',
      en: 'Proposal Event',
    },
    description: {
      ko: '오키나와 선셋 바다 위에서 일생일대의 프로포즈. 꽃, 샴페인, 사진 촬영까지 완벽한 순간을 연출합니다.',
      ja: '沖縄のサンセットの海で一生に一度のプロポーズ。花、シャンパン、写真撮影まで、完璧な瞬間を演出。',
      en: 'A once-in-a-lifetime proposal on the Okinawa sunset sea. Flowers, champagne, and photography — we craft the perfect moment.',
    },
    category: 'proposal',
    priceCharter: 350000,
    pricePerPerson: null,
    minPersons: 2,
    maxPersons: 6,
    durationMinutes: 180,
    durationLabel: { ko: '약 3시간', ja: '約3時間', en: 'Approx. 3 hours' },
    includes: {
      ko: ['플라워 데코레이션', '샴페인', '기념 촬영', '맞춤 연출'],
      ja: ['フラワーデコレーション', 'シャンパン', '記念撮影', 'カスタム演出'],
      en: ['Flower decoration', 'Champagne', 'Photography', 'Custom staging'],
    },
    image: '/images/proposal.jpg',
    available: true,
  },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}
