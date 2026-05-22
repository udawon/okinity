# PONYOKINAWA

오키나와 현지 강사가 직접 안내하는 스쿠버다이빙 투어 홈페이지.
한·영·일 3개국어 · 모바일 우선 반응형 · 콘텐츠/디자인 분리.

설계 문서: `~/.gstack/projects/ponyokinawa/won-unknown-design-*.md`

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 필요 값 채우기 (없어도 dev 동작)
npm run dev                  # http://localhost:3000 → /ko 로 리다이렉트
```

빌드/검증:

```bash
npm run typecheck   # 타입 체크
npm run build       # 프로덕션 빌드 (정적 생성)
npm run lint        # ESLint
```

## 구조

```
content/                # ★ 콘텐츠 (md/json) — 비개발자가 편집하는 곳
  ko/products/*.md      #   상품 4종 (frontmatter + 본문). en/ja 추가 시 같은 구조로.
  ko/instructor.md      #   강사 소개 (신뢰 앵커)
  ko/reviews.json       #   후기
messages/{ko,en,ja}.json # UI 문구 (버튼·라벨 등)
src/
  config/
    design.config.ts    # ★ 디자인 토큰 (색·폰트·간격) — 디자인 교체 = 이 파일 수정
    site.config.ts      #   사이트명·연락처·SNS·OG 기본값
  i18n/                 #   next-intl 라우팅·요청 설정
  lib/content.ts        #   md/json 로더 + zod 검증 + 로케일 폴백
  components/           #   Header/Hero/ProductCard/InquiryForm 등
  app/[locale]/         #   페이지 (/, /products, /products/[slug], /instructor, /contact)
  app/api/inquiry/      #   예약 문의 폼 처리 (이메일 발송)
```

## 콘텐츠 편집

- **상품 추가/수정**: `content/ko/products/*.md` 의 frontmatter와 본문 편집.
  - `priceKRW`를 비우면 "문의 시 안내"로 표시됨 (가격 공개 여부는 운영 결정).
- **디자인 변경**: `src/config/design.config.ts` 의 토큰만 바꾸면 전체 색·폰트 반영.
  - 단, 토큰 교체 시 명암 대비(WCAG AA)가 깨질 수 있으니 확인할 것.
- **번역 추가**: `content/en/`, `content/ja/` 에 같은 파일명으로 추가.
  파일이 없으면 자동으로 한국어로 폴백되며 해당 페이지는 검색 비색인(noindex) 처리됨.

## 다국어(i18n) 정책

- 경로: `/ko`, `/en`, `/ja` (기본 `ko`).
- 콘텐츠 미번역 시: 한국어 폴백 + 번역 안내 배너 + `noindex`.
- UI 문구는 3개국어 모두 완비. 상품/강사 콘텐츠는 한국어 우선 → 영·일 점진 채움.

## 예약 문의 (폼)

- `/contact` 폼 → `POST /api/inquiry` → 강사 이메일 발송.
- `RESEND_API_KEY` 미설정 시 콘솔 로그로 대체(로컬 개발 편의).
- 운영 전: `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` 설정 필요.
- 온라인 결제 없음(설계 결정). 결제는 강사가 문의 후 직접 조율.

## 어드민 (/admin) — 문의 관리

로그인으로 보호되는 대시보드에서 들어온 예약 문의를 조회하고 상태(신규/확정/완료/취소)를 관리한다.

- 접근: `/admin` (로그인 안 되어 있으면 `/admin/login`으로 리다이렉트)
- 로그인: `ADMIN_PASSWORD` 비밀번호 → HMAC 서명 쿠키(HttpOnly, 12시간) 발급
- 보호: 미들웨어가 `/admin/*`를 세션 쿠키로 차단 + 서버액션에서 2차 재검증
- 어드민은 다국어를 타지 않으며(한국어 전용), 검색 비색인(noindex) 처리됨

필수 환경변수:

```
ADMIN_PASSWORD=원하는비밀번호
ADMIN_SESSION_SECRET=$(openssl rand -base64 32)   # 운영 필수
```

### 문의 저장소 (어댑터)

문의는 폼 제출 시 **저장소에 영속**된다(이메일은 별도 알림). 저장이 source of truth.

| 환경 | 저장소 | 비고 |
|---|---|---|
| `POSTGRES_URL` 미설정 | JSON 파일 (`.data/inquiries.json`) | 로컬/단일서버 전용. **Vercel 등 서버리스에선 휘발 → 데이터 사라짐** |
| `POSTGRES_URL` 설정 | Postgres (`@vercel/postgres`) | 프로덕션 권장. 첫 호출 시 테이블 자동 생성 |

> ⚠ Vercel 배포 시에는 반드시 Postgres(Neon/Vercel Postgres/Supabase 등)를 연결하고
> `POSTGRES_URL`을 설정할 것. 안 그러면 폼 문의가 저장되지 않는다.

## 배포

Vercel 권장 (GitHub 연동 → main 머지 시 자동 배포). 환경변수는 Vercel 대시보드에 설정.

배포 전 필수 환경변수: `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
`POSTGRES_URL`, (선택) `RESEND_API_KEY`·`INQUIRY_TO_EMAIL`.

## 출시 전 체크리스트 (설계 문서의 gating/assignment)

- [ ] 강사 신뢰 콘텐츠 확보: 소개·자격·경력 / 후기 3개+ / 사진 10장+
- [ ] gating #1: 가격 공개 여부 결정 → 상품 md의 `priceKRW` 반영
- [ ] gating #2: 강사 수신 이메일 + Resend 키 설정
- [ ] placeholder 이미지를 실제 사진으로 교체 (`public/images/`, OG용 1200×630 PNG)
- [ ] 도메인 연결 + `NEXT_PUBLIC_SITE_URL` 설정
- [ ] 영·일 번역 (기계번역 초벌 → 현지 검수, 다이빙 안전 용어 주의)

## 한계 (스캐폴드)

- 폼 rate-limit이 in-memory라 다중 인스턴스/서버리스에서 부정확 → 운영 시 Upstash 등으로 교체.
- Google Sheet 적재는 미구현(설계상 fast-follow).
- 동적 OG 이미지 생성 미구현(상품별 정적 PNG 권장).
