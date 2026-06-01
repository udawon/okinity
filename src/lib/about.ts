import { z } from 'zod';

/**
 * 소개(About) 페이지 콘텐츠 — 센터 소개형.
 * 저장: site_content 'about' 키. 비어 있는 필드는 ABOUT_DEFAULTS 기본값으로 대체.
 * 범용 모듈(server-only 의존 없음).
 */

const StrengthSchema = z.object({
  title: z.string().default(''),
  desc: z.string().default('')
});

export const AboutContentSchema = z.object({
  eyebrow: z.string().default(''),
  title: z.string().default(''), // 줄바꿈(\n) 시 마지막 줄 강조색
  intro: z.string().default(''),
  heroImage: z.string().default(''),
  body: z.string().default(''), // 소개 본문(여러 단락)
  strengths: z.array(StrengthSchema).default([]), // 핵심 강점(3개 권장)
  instructorName: z.string().default(''),
  instructorRole: z.string().default(''),
  instructorPhoto: z.string().default(''),
  instructorCerts: z.string().default(''), // 줄바꿈/쉼표 구분
  instructorBody: z.string().default('')
});
export type AboutContent = z.infer<typeof AboutContentSchema>;
export type Strength = z.infer<typeof StrengthSchema>;

/** 기본 콘텐츠(시드) — 어드민 미입력 시 표시되는 현재 값. */
export const ABOUT_DEFAULTS: AboutContent = {
  eyebrow: 'ABOUT US',
  title: '오키나와 바다를\n가장 잘 아는 사람들',
  intro:
    '여행사를 통한 재판매가 아닙니다. 처음 만나는 순간부터 물 밖으로 나오는 순간까지, 현지 전문 가이드가 직접 함께합니다.',
  heroImage: '',
  body: '오키나와에 살며 매일 이 바다에 들어가는 사람들이 운영하는 다이브 센터입니다.\n그날의 조류·시야·날씨를 읽고 가장 좋은 포인트로 안내하며, 초보자에게는 천천히·경험자에게는 깊이 있게 맞춰 진행합니다. 예약부터 브리핑, 수중 사인까지 모두 한국어로 편하게 소통하고, 안전을 최우선으로 합니다.',
  strengths: [
    {
      title: '현지 직영 운영',
      desc: '재판매가 아닌 현지 직영. 그날의 바다 상태에 맞춰 최적의 포인트를 직접 고릅니다.'
    },
    {
      title: '한국어 안전 가이드',
      desc: '예약·브리핑·수중 사인까지 한국어로. 전 게스트 다이빙 상해보험으로 안전을 보장합니다.'
    },
    {
      title: '소수정예 프라이빗',
      desc: '한 팀 최대 6명. 강사가 모든 게스트의 호흡을 끝까지 케어합니다.'
    }
  ],
  instructorName: '(대표 강사 이름)',
  instructorRole: '오키나와 현지 거주 다이빙 강사 · PADI 인스트럭터',
  instructorPhoto: '',
  instructorCerts: 'PADI 오픈워터 스쿠버 인스트럭터\n응급처치(EFR) 강사',
  instructorBody:
    '오키나와에 살며 매일 이 바다에 들어가는 다이빙 강사입니다. 여행사를 통한 재판매가 아니라, 처음 만나는 순간부터 물 밖으로 나오는 순간까지 제가 직접 함께합니다. (실제 강사 소개·경력을 채워 넣으세요.)'
};

/** site_content 값을 안전 파싱(실패 시 빈 값). */
export function parseAbout(raw: unknown): Partial<AboutContent> {
  const parsed = AboutContentSchema.partial().safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

/** 오버라이드(어드민 저장값) 위에 기본값을 깔아 최종 표시 콘텐츠를 만든다. */
export function resolveAbout(override: Partial<AboutContent> | null | undefined): AboutContent {
  const o = override ?? {};
  const str = (v: string | undefined, d: string) => (v && v.trim() ? v : d);
  const hasStrengths = Array.isArray(o.strengths) && o.strengths.some((s) => s?.title || s?.desc);
  return {
    eyebrow: str(o.eyebrow, ABOUT_DEFAULTS.eyebrow),
    title: str(o.title, ABOUT_DEFAULTS.title),
    intro: str(o.intro, ABOUT_DEFAULTS.intro),
    heroImage: str(o.heroImage, ABOUT_DEFAULTS.heroImage),
    body: str(o.body, ABOUT_DEFAULTS.body),
    strengths: hasStrengths ? (o.strengths as Strength[]) : ABOUT_DEFAULTS.strengths,
    instructorName: str(o.instructorName, ABOUT_DEFAULTS.instructorName),
    instructorRole: str(o.instructorRole, ABOUT_DEFAULTS.instructorRole),
    instructorPhoto: str(o.instructorPhoto, ABOUT_DEFAULTS.instructorPhoto),
    instructorCerts: str(o.instructorCerts, ABOUT_DEFAULTS.instructorCerts),
    instructorBody: str(o.instructorBody, ABOUT_DEFAULTS.instructorBody)
  };
}

/** 줄바꿈/쉼표로 구분된 문자열을 리스트로(자격증 등). */
export function splitList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}
