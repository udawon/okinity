# OKINITY — 프로젝트 지침

## Design System
시각·UI 작업 전 항상 `DESIGN.md`를 먼저 읽는다.
색상·폰트·간격·라운드·모션·이중 레이어(시네마틱/기능) 규칙이 그곳에 정의돼 있다.

- 시각 토큰의 단일 출처(코드): `src/config/design.config.ts` → `tailwind.config.ts`가 import
- 폰트·시네마틱 색: `src/app/globals.css`, `src/app/layout.tsx`
- 터콰이즈 재도입 금지(2026-06-04 결정). 골드 `accent`는 폐기된 방향
- DESIGN.md와 다른 색·폰트를 쓰려면 명시적 승인을 받는다
