/**
 * 디자인 토큰 — 시각 스타일의 단일 출처(Single Source of Truth).
 * 테마: "Miti Navi — Nautical parchment & polished brass" (DESIGN.md 반영).
 *   양피지 배경 + 딥 차콜 텍스트, 세리프 제목 + 모노 본문, 라운드 0·플랫(그림자/그라데이션 없음).
 *
 * 컴포넌트 호환을 위해 기존 토큰 키 이름(brand/accent/...)을 유지하되 값을 새 팔레트로 매핑.
 * 접근성: Linen(#999999)은 양피지 배경에서 본문 대비 미달이라, 본문/보조 텍스트는 Ebony로 매핑.
 */
export const design = {
  colors: {
    // 'brand' = 1차 액션/버튼 = Deep Charcoal
    brand: {
      DEFAULT: '#000e13', // Deep Charcoal — 버튼 배경, 강한 보더
      dark: '#232323', // Ebony — hover
      light: '#d9cfb9', // muted parchment — 이미지 placeholder 배경
      contrast: '#e6dece' // Parchment — 차콜 위 텍스트
    },
    // 유일한 색 강조 = Amber Glaze (외곽선·미세 하이라이트에만)
    accent: {
      DEFAULT: '#ffdead', // Amber Glaze
      dark: '#8a6d1f', // 읽을 수 있는 다크 앰버(큰 텍스트용)
      light: '#fff6e6'
    },
    ink: '#000e13', // Deep Charcoal — 본문/제목
    muted: '#232323', // Ebony — 보조 텍스트(AA 안전)
    line: '#c2b69c', // 양피지 톤 보더(가시성 확보)
    surface: '#efe9dc', // 카드: 배경보다 살짝 밝게(그림자 없이 평면 구분)
    bg: '#e6dece' // Parchment — 페이지 배경
  },
  // DESIGN.md: 모든 요소 0px 라운드 (각진 구조적 미감)
  radius: {
    card: '0px',
    button: '0px'
  },
  // DESIGN.md: 그림자/엘리베이션 없음 — 평면 유지
  shadow: {
    card: 'none',
    hover: 'none'
  },
  container: {
    max: '82.5rem' // 1320px
  }
} as const;

export type Design = typeof design;
