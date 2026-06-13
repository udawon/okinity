# Design System — OKINITY

> 시네마틱 오션 + 밝은 트로피컬 리조트. 포카리 스카이블루가 브랜드를 관통한다.

**작성:** 2026-06-08 (/design-consultation 진단 — 실제 코드에서 추출, 외형 변경 없음)
**단일 출처(코드):** `src/config/design.config.ts` → `tailwind.config.ts`가 import. 폰트/시네마틱 색은 `src/app/globals.css` + `layout.tsx`.

---

## Product Context
- **무엇:** 일본 오키나와 다이빙/스노클링/PADI/낚시 투어 예약 사이트
- **대상:** 한국·일본·영어권 여행자 (ko/en/ja)
- **포지셔닝:** 강사 직접 운영의 따뜻함 + 푸른동굴·케라마의 바다를 시네마틱하게
- **기억시킬 한 가지:** "오키나와의 그 투명한 바다 블루" — 포카리 스카이블루(#5fc6ef)

---

## 두 개의 레이어 (의도된 이중 구조)

OKINITY는 surface 성격에 따라 두 시각 언어를 쓴다. 이건 결함이 아니라 의도된 분리다.

| 레이어 | 쓰임 | 톤 | 핵심 색 | 토큰화 |
|--------|------|----|---------|--------|
| **시네마틱 마케팅** | 홈(OceanHome), 예약 플로우, 히어로 | 다크·몰입형, 애니메이션 | 포카리 스카이블루 `#5fc6ef` + 오션 그라디언트 | ❌ 하드코딩 |
| **기능/콘텐츠** | 투어상세·블로그·공지·어드민·폼 | 밝은 리조트, 카드+여백 | 오션블루 `#0c8bd0` + 뉴트럴 | ✅ 토큰 기반 |

> 두 블루(#5fc6ef vs #0c8bd0)가 공존하는 이유는 **명암 대비**로 정당화된다: 밝은 #5fc6ef는 다크 시네마틱 위에서 빛나고, 더 진한 #0c8bd0은 흰 배경 버튼에서 WCAG 대비를 확보한다. (아래 "개선 제안" 참고 — 이 규칙을 명시화할지 통일할지는 선택)

---

## Tokens — Colors

### 기능 레이어 (토큰, `design.config.ts`)
| Name | Value | Token / Class | Role |
|------|-------|---------------|------|
| Brand | `#0c8bd0` | `brand` (bg/text/border) | 1차 액션·링크·강조 (밝은 화면). 26개 파일 사용 |
| Brand Dark | `#086aa8` | `brand.dark` | hover·진한 상태 |
| Brand Light | `#e3f1fb` | `brand.light` | 옅은 배경·칩 |
| Ink | `#2b2a26` | `ink` | 본문·제목 (따뜻한 진회색) |
| Muted | `#6b6760` | `muted` | 보조 텍스트 |
| Line | `#d8e6f3` | `line` | 보더 (모래빛) |
| Surface | `#ffffff` | `surface` | 카드 (그림자로 부양) |
| Background | `#eef4fb` | `bg` | 페이지 배경 (쿨 크림) |

### 시네마틱 레이어 (하드코딩, `globals.css` + 컴포넌트)
| Name | Value | 위치 | Role |
|------|-------|------|------|
| Pocari Sky | `#5fc6ef` | `text-[#5fc6ef]` 등 ~12곳 | 시네마틱 브랜드 강조·날짜·포커스링 |
| Ocean Gradient | `#1f72b0 → #5fc6ef → #eaf6ff` | `.text-ocean` | 흐르는 바다 텍스트(히어로) |

### 비활성/잔재 토큰 (정리 후보)
- `accent` 골드 `#cf9a55` — **사실상 미사용**(쇼케이스 페이지만). 구 "Siyam 골드" 잔재
- `panel` `#d9e7f4` — 1곳만 사용
- `ScheduleCalendar.tsx:12` "터콰이즈" 주석 — 브랜드 금지색 잔재

---

## Tokens — Typography

폰트는 `next/font/google`로 self-host. 제목=세리프, 본문/UI=산세리프.

| 역할 | 폰트 (라틴 / 한글) | CSS 변수 |
|------|---------------------|----------|
| 제목 (h1–h4) | **Playfair Display** / **Noto Serif KR** | `--font-serif` |
| 본문·UI·버튼 | **Noto Sans KR** | `--font-sans` |

- 폴백: serif → Georgia; sans → -apple-system, Apple SD Gothic Neo, system-ui
- 우아한 세리프 제목 + 깔끔한 산세리프 본문 = 리조트의 품격 + 가독성

---

## Tokens — Shape & Spacing

- **Radius:** card `1rem` (`rounded-card`, 34곳) · button `9999px` 알약형 (`rounded-button`, 31곳)
- **Shadow (소프트, 카드 부양감):**
  - card: `0 1px 3px rgba(43,42,38,.05), 0 12px 32px rgba(43,42,38,.08)`
  - hover: `0 8px 20px rgba(43,42,38,.10), 0 24px 56px rgba(15,154,163,.16)`
- **Container max:** `78rem` (1248px)
- **Base unit:** 4px (Tailwind 기본 스케일 사용)

---

## Motion

- **풀페이지 스크롤 스냅** (모바일/터치): `html.snap-page` — 섹션당 한 화면, 스와이프 한 번에 한 섹션
- **시네마틱:** god-rays(`ocean-rays` 9s), 흐르는 바다 텍스트(`ocean-flow` 6s), transform/opacity/background-position만 사용(리플로우 0)
- **접근성:** 모든 모션이 `prefers-reduced-motion: reduce`에서 비활성

---

## Do's and Don'ts

### Do
- 시네마틱 화면(홈·예약)엔 포카리 `#5fc6ef`, 기능 화면(콘텐츠·어드민)엔 `brand #0c8bd0`을 쓴다
- 제목은 세리프(Playfair/Noto Serif KR), 본문은 Noto Sans KR
- 카드는 `rounded-card`(1rem) + 소프트 섀도로 부양, 버튼은 알약형(`rounded-button`)
- 새 색·간격이 필요하면 먼저 `design.config.ts` 토큰을 본다

### Don't
- **터콰이즈 재도입 금지** (브랜드 결정 2026-06-04)
- 골드 `accent`를 새로 쓰지 말 것 (사실상 폐기된 방향)
- 시네마틱 블루를 또 다른 hex로 하드코딩하지 말 것 — `#5fc6ef`로 통일
- 토큰을 우회한 임의 색 남발 금지

---

## 개선 제안 (컨설팅 — 현재는 적용 안 함, 외형 변경 없음)

현재 사이트는 만족스러운 상태이며 아래는 **나중에 선택적으로** 할 수 있는 무손상 정리다.

1. **시네마틱 블루 토큰화** — 흩어진 `#5fc6ef`(~12곳)를 `brand-cine` 같은 토큰 하나로 수렴. *픽셀 동일*, 색 드리프트 방지 (터콰이즈 주석이 드리프트의 증거).
2. **두 블루 정책 명문화 or 통일** — (a) "다크=#5fc6ef, 라이트=#0c8bd0" 규칙으로 굳히거나, (b) 포카리 결정대로 #5fc6ef로 통일. 단 (b)는 흰 배경 버튼 대비(WCAG)와 외형이 바뀌므로 별도 결정 필요.
3. **죽은 토큰 제거** — 골드 `accent`, `panel`, "Siyam" 헤더 주석, "터콰이즈" 주석 정리. *외형 무관*.

---

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | 브랜드색 = 포카리 스웨트(스카이블루 #5fc6ef + 딥블루 + 쿨화이트), 터콰이즈 금지 | 브랜드 아이덴티티 확정 |
| 2026-06-08 | DESIGN.md를 실제 코드 기준으로 재작성 (구 "Miti Navi" 내용 폐기) | 문서가 실제 시스템과 불일치 → /design-consultation 진단으로 정정 |
