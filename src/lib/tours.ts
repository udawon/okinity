export interface Tour {
  id: string;
  slug: string;
  categorySlug: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
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

export interface TourCategory {
  slug: string;
  title: { ko: string; ja: string; en: string };
  description: { ko: string; ja: string; en: string };
  icon: string;
  image: string;
  tours: Tour[];
}

export const tourCategories: TourCategory[] = [
  {
    slug: 'private-cruise',
    title: {
      ko: '프라이빗 크루즈',
      ja: 'プライベートクルーズ',
      en: 'Private Cruise',
    },
    description: {
      ko: '소수인원 전용 프라이빗 요트로 오키나와의 에메랄드빛 바다를 만끽하세요',
      ja: '少人数専用プライベートヨットで沖縄のエメラルドグリーンの海を満喫',
      en: 'Enjoy Okinawa\'s emerald waters on an exclusive private yacht',
    },
    icon: '⛵',
    image: '/images/cruise.jpg',
    tours: [
      {
        id: '1',
        slug: 'vip-business',
        categorySlug: 'private-cruise',
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
        id: '2',
        slug: 'mv-filming',
        categorySlug: 'private-cruise',
        title: {
          ko: 'MV/영화 촬영',
          ja: 'MV・映画撮影',
          en: 'MV/Film Shooting',
        },
        description: {
          ko: '오키나와의 아름다운 해상 배경에서 뮤직비디오, 영화, 화보 촬영. 최적의 촬영 포인트와 전문 서포트를 제공합니다.',
          ja: '沖縄の美しい海を背景にミュージックビデオ、映画、グラビア撮影。最適な撮影ポイントと専門サポートをご提供。',
          en: 'Shoot music videos, films, and photo spreads against Okinawa\'s stunning seascape with professional support.',
        },
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
        id: '3',
        slug: 'private-party',
        categorySlug: 'private-cruise',
        title: {
          ko: '프라이빗 파티',
          ja: 'プライベートパーティー',
          en: 'Private Party',
        },
        description: {
          ko: '생일, 기념일, 단체 파티를 바다 위에서! 음악, 음식, 분위기까지 맞춤 세팅으로 잊지 못할 파티를 만들어드립니다.',
          ja: '誕生日、記念日、グループパーティーを海の上で！音楽、料理、雰囲気まで、カスタム設定で忘れられないパーティーを。',
          en: 'Birthdays, anniversaries, group celebrations on the water! Custom setup for an unforgettable party.',
        },
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
        id: '4',
        slug: 'proposal',
        categorySlug: 'private-cruise',
        title: {
          ko: '프로포즈 이벤트',
          ja: 'プロポーズイベント',
          en: 'Proposal Event',
        },
        description: {
          ko: '오키나와 선셋 바다 위에서 일생일대의 프로포즈. 꽃, 샴페인, 사진 촬영까지 완벽한 순간을 연출합니다.',
          ja: '沖縄のサンセットの海で一生に一度のプロポーズ。花、シャンパン、写真撮影まで、完璧な瞬間を演出。',
          en: 'A once-in-a-lifetime proposal on the Okinawa sunset sea. Flowers, champagne, and photography.',
        },
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
    ],
  },
  {
    slug: 'fishing',
    title: {
      ko: '피싱 투어',
      ja: 'フィッシングツアー',
      en: 'Fishing Tour',
    },
    description: {
      ko: '오키나와의 풍부한 바다에서 즐기는 본격 낚시 체험',
      ja: '沖縄の豊かな海で楽しむ本格フィッシング体験',
      en: 'Authentic fishing experiences in Okinawa\'s rich waters',
    },
    icon: '🎣',
    image: '/images/fishing.jpg',
    tours: [
      {
        id: '5',
        slug: 'fishing-3h',
        categorySlug: 'fishing',
        title: {
          ko: '체험 3시간 코스',
          ja: '体験3時間コース',
          en: '3-Hour Experience',
        },
        description: {
          ko: '낚시 초보자도 즐길 수 있는 가벼운 체험 코스. 장비 대여와 기본 가이드가 포함되어 누구나 쉽게 참여할 수 있습니다.',
          ja: '釣り初心者でも楽しめるライトな体験コース。レンタル装備と基本ガイド付きで、誰でも気軽に参加できます。',
          en: 'A light experience course for beginners. Equipment rental and basic guide included for easy participation.',
        },
        priceCharter: 150000,
        pricePerPerson: 20000,
        minPersons: 2,
        maxPersons: 8,
        durationMinutes: 180,
        durationLabel: { ko: '약 3시간', ja: '約3時間', en: 'Approx. 3 hours' },
        includes: {
          ko: ['낚시 장비 대여', '미끼', '음료', '가이드'],
          ja: ['釣り道具レンタル', 'エサ', 'ドリンク', 'ガイド'],
          en: ['Fishing gear rental', 'Bait', 'Drinks', 'Guide'],
        },
        image: '/images/fishing.jpg',
        available: true,
      },
      {
        id: '6',
        slug: 'fishing-6h',
        categorySlug: 'fishing',
        title: {
          ko: '원데이 6시간 코스',
          ja: 'ワンデイ6時間コース',
          en: '6-Hour Full Day',
        },
        description: {
          ko: '오키나와 근해의 다양한 포인트를 돌며 본격적으로 즐기는 하루 낚시 코스. 점심 도시락과 음료가 포함됩니다.',
          ja: '沖縄近海の様々なポイントを巡る本格的な一日フィッシングコース。昼食弁当とドリンク付き。',
          en: 'A full-day fishing course exploring various spots around Okinawa. Lunch box and drinks included.',
        },
        priceCharter: 280000,
        pricePerPerson: 35000,
        minPersons: 2,
        maxPersons: 8,
        durationMinutes: 360,
        durationLabel: { ko: '약 6시간', ja: '約6時間', en: 'Approx. 6 hours' },
        includes: {
          ko: ['낚시 장비 대여', '미끼', '점심 도시락', '음료', '가이드'],
          ja: ['釣り道具レンタル', 'エサ', '昼食弁当', 'ドリンク', 'ガイド'],
          en: ['Fishing gear rental', 'Bait', 'Lunch box', 'Drinks', 'Guide'],
        },
        image: '/images/fishing.jpg',
        available: true,
      },
      {
        id: '7',
        slug: 'fishing-pro',
        categorySlug: 'fishing',
        title: {
          ko: '전문가 코스',
          ja: 'エキスパートコース',
          en: 'Expert Course',
        },
        description: {
          ko: '대물을 노리는 전문가를 위한 프리미엄 코스. 경험 풍부한 선장이 최고의 포인트로 안내하며, 잡은 물고기는 회로 즐길 수 있습니다.',
          ja: '大物を狙うエキスパート向けプレミアムコース。経験豊富な船長が最高のポイントへご案内。釣った魚はお刺身でお楽しみいただけます。',
          en: 'Premium course for experts targeting big catches. An experienced captain guides you to the best spots. Enjoy sashimi from your catch.',
        },
        priceCharter: 450000,
        pricePerPerson: null,
        minPersons: 2,
        maxPersons: 6,
        durationMinutes: 480,
        durationLabel: { ko: '약 8시간', ja: '約8時間', en: 'Approx. 8 hours' },
        includes: {
          ko: ['프리미엄 장비', '미끼', '점심 식사', '음료', '전문 가이드', '회 서비스'],
          ja: ['プレミアム装備', 'エサ', '昼食', 'ドリンク', '専門ガイド', '刺身サービス'],
          en: ['Premium gear', 'Bait', 'Lunch', 'Drinks', 'Expert guide', 'Sashimi service'],
        },
        image: '/images/fishing.jpg',
        available: true,
      },
    ],
  },
  {
    slug: 'fireworks',
    title: {
      ko: '불꽃축제 관람',
      ja: '花火大会観覧',
      en: 'Fireworks Festival',
    },
    description: {
      ko: '오키나와 최대 불꽃축제를 바다 위 특별석에서 감상하세요',
      ja: '沖縄最大の花火大会を海上の特別席からお楽しみください',
      en: 'Watch Okinawa\'s biggest fireworks festivals from a private VIP seat on the sea',
    },
    icon: '🎆',
    image: '/images/fireworks.jpg',
    tours: [
      {
        id: '8',
        slug: 'fireworks-april',
        categorySlug: 'fireworks',
        title: {
          ko: '4월 불꽃축제',
          ja: '4月花火大会',
          en: 'April Fireworks Festival',
        },
        description: {
          ko: '매년 4월 오키나와 봄 불꽃축제를 바다 위 프라이빗 요트에서 감상하세요. 1만발의 불꽃이 밤하늘을 수놓습니다.',
          ja: '毎年4月の沖縄春花火大会をプライベートヨットから観覧。1万発の花火が夜空を彩ります。',
          en: 'Enjoy Okinawa\'s spring fireworks festival every April from a private yacht. 10,000 fireworks lighting up the night sky.',
        },
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
        id: '9',
        slug: 'fireworks-october',
        categorySlug: 'fireworks',
        title: {
          ko: '10월 불꽃축제',
          ja: '10月花火大会',
          en: 'October Fireworks Festival',
        },
        description: {
          ko: '매년 10월 오키나와 가을 불꽃축제를 바다 위 프라이빗 요트에서 감상하세요. 가을밤의 화려한 불꽃을 오직 당신만을 위한 특별석에서.',
          ja: '毎年10月の沖縄秋花火大会をプライベートヨットから観覧。秋の夜の華やかな花火をあなただけの特別席から。',
          en: 'Watch Okinawa\'s autumn fireworks festival every October from a private yacht. Spectacular fireworks from your exclusive seat.',
        },
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
    ],
  },
  {
    slug: 'bbq',
    title: {
      ko: '선상 바베큐',
      ja: '船上バーベキュー',
      en: 'Onboard BBQ',
    },
    description: {
      ko: '오키나와 바다 위에서 즐기는 프리미엄 바베큐 파티',
      ja: '沖縄の海の上で楽しむプレミアムバーベキューパーティー',
      en: 'Premium BBQ party on the waters of Okinawa',
    },
    icon: '🍖',
    image: '/images/bbq.jpg',
    tours: [
      {
        id: '10',
        slug: 'bbq',
        categorySlug: 'bbq',
        title: {
          ko: '선상 바베큐',
          ja: '船上バーベキュー',
          en: 'Onboard BBQ',
        },
        description: {
          ko: '오키나와의 아름다운 바다를 바라보며 즐기는 프리미엄 바베큐. 신선한 해산물과 고급 식재료로 특별한 시간을 보내세요.',
          ja: '沖縄の美しい海を眺めながら楽しむプレミアムバーベキュー。新鮮な海鮮と高級食材で特別なひとときを。',
          en: 'Premium BBQ while enjoying the beautiful Okinawa sea. Fresh seafood and premium ingredients for a special time.',
        },
        priceCharter: 350000,
        pricePerPerson: 30000,
        minPersons: 4,
        maxPersons: 10,
        durationMinutes: 300,
        durationLabel: { ko: '약 5시간', ja: '約5時間', en: 'Approx. 5 hours' },
        includes: {
          ko: ['바베큐 세트', '해산물', '고기류', '음료', '디저트'],
          ja: ['BBQセット', '海鮮', 'お肉', 'ドリンク', 'デザート'],
          en: ['BBQ set', 'Seafood', 'Meat', 'Drinks', 'Dessert'],
        },
        image: '/images/bbq.jpg',
        available: true,
      },
    ],
  },
];

// Helper functions
export function getAllTours(): Tour[] {
  return tourCategories.flatMap((cat) => cat.tours);
}

export function getCategoryBySlug(slug: string): TourCategory | undefined {
  return tourCategories.find((cat) => cat.slug === slug);
}

export function getTourBySlug(categorySlug: string, tourSlug: string): Tour | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.tours.find((t) => t.slug === tourSlug);
}

export function getTourById(id: string): Tour | undefined {
  return getAllTours().find((t) => t.id === id);
}
