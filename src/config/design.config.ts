/**
 * 디자인 토큰 — 시각 스타일의 단일 출처(Single Source of Truth).
 * 테마: "Siyam-inspired" — 밝은 트로피컬 리조트 톤. 모래빛 배경 + 오션 틸,
 *   둥근 모서리·부드러운 그림자, 세리프 제목 + 산세리프 본문, 사진 중심.
 *   (Sun Siyam의 디자인 언어를 참고한 원본 구현 — 자산 복제 아님)
 *
 * "디자인을 config로 교체"한다는 요구는 이 파일 수정으로 충족된다. tailwind.config.ts가 import.
 * 색 토큰 변경 시 명암 대비(WCAG AA: 본문 4.5:1)를 확인할 것.
 */
export const design = {
  colors: {
    // 1차 액션 = 오션 틸 (트로피컬 바다)
    brand: {
      DEFAULT: '#0f9aa3',
      dark: '#0b767d',
      light: '#e4f4f5',
      contrast: '#ffffff'
    },
    // 따뜻한 모래/골드 보조 강조 (희소하게)
    accent: {
      DEFAULT: '#cf9a55',
      dark: '#9a6f33',
      light: '#f7ecdb'
    },
    ink: '#2b2a26', // 본문/제목 (따뜻한 진회색)
    muted: '#6b6760', // 보조 텍스트
    line: '#e7e0d3', // 모래빛 보더
    surface: '#ffffff', // 카드 (흰색, 그림자로 부양)
    bg: '#f5efe4', // 페이지 배경 (모래/크림)
    panel: '#eeded2' // 카드 텍스트 영역 (핑크베이지, 배경과 구분 — 레퍼런스 Must-Do 톤)
  },
  // 둥근 모서리 (리조트 톤). 버튼은 알약형.
  radius: {
    card: '1rem',
    button: '9999px'
  },
  // 부드러운 그림자 (카드 부양감)
  shadow: {
    card: '0 1px 3px rgba(43,42,38,0.05), 0 12px 32px rgba(43,42,38,0.08)',
    hover: '0 8px 20px rgba(43,42,38,0.10), 0 24px 56px rgba(15,154,163,0.16)'
  },
  container: {
    max: '78rem' // 1248px
  }
} as const;

export type Design = typeof design;
