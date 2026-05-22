# 배포 가이드 (PONYOKINAWA → okinity)

리모트: `https://github.com/udawon/okinity.git` · 브랜치: `main`
호스팅: Vercel (Next.js 네이티브) · 문의 저장: Postgres

---

## 1. GitHub에 push (인증 필요 — 본인이 실행)

이 머신엔 SSH 키·gh CLI가 없어 **HTTPS + Personal Access Token(PAT)** 으로 push 합니다.

### 1-1. PAT 발급 (udawon 계정 GitHub)

- GitHub → Settings → Developer settings → Personal access tokens
- **Fine-grained**: Repository access = `udawon/okinity`, Permissions → Contents: **Read and write**
- (또는 classic: `repo` 스코프)
- 생성된 토큰 문자열 복사 (한 번만 보임)

### 1-2. push

Claude Code 세션에서 `!` 를 붙여 직접 실행 (토큰을 채팅에 붙이지 말 것):

```
! git push -u origin main
```

- Username 프롬프트: `udawon`
- Password 프롬프트: **위 PAT 붙여넣기** (비밀번호 아님)
- macOS 키체인이 저장하므로 다음부터는 자동.

---

## 2. Vercel 프로젝트 생성

### 방법 A: 대시보드(권장, 자동 CI/CD)

1. https://vercel.com → Add New → Project
2. `udawon/okinity` 레포 Import (GitHub 연동)
3. Framework: Next.js 자동 감지 → Build/Output 기본값 그대로
4. Deploy (환경변수는 3에서 추가 후 재배포)

→ 이후 `main`에 push할 때마다 자동 배포, PR은 프리뷰 배포.

### 방법 B: Vercel CLI

```
npm i -g vercel
! vercel login
vercel        # 프리뷰 배포
vercel --prod # 프로덕션 배포
```

---

## 3. Postgres 연결 (문의 영속 — 필수)

⚠ 연결 안 하면 폼 문의가 서버리스에서 사라집니다 (서버 시작 시 경고가 뜸).

### Vercel Storage(가장 쉬움 — Neon 기반)

1. Vercel 프로젝트 → Storage → Create Database → **Postgres**
2. 생성하면 `POSTGRES_URL` 등 환경변수가 **자동 주입**됨 (우리 코드가 바로 사용)
3. 첫 문의 시 `inquiries` 테이블 자동 생성

### 외부 Neon 사용 시

- https://neon.tech → 프로젝트 생성 → connection string 복사
- Vercel 환경변수에 `POSTGRES_URL` 로 등록

---

## 4. 환경변수 (Vercel → Settings → Environment Variables)

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | 배포 도메인 (예: `https://okinity.vercel.app` 또는 커스텀 도메인). OG·sitemap 절대 URL |
| `ADMIN_PASSWORD` | ✅ | 어드민 로그인 비밀번호 |
| `ADMIN_SESSION_SECRET` | ✅ | 세션 서명 키. 아래 명령으로 생성: |
| `POSTGRES_URL` | ✅ | Vercel Postgres 쓰면 자동. 외부 Neon이면 수동 등록 |
| `RESEND_API_KEY` | 선택 | 이메일 알림(나중에). 없으면 문의는 저장만 됨 |
| `INQUIRY_TO_EMAIL` | 선택 | 강사 수신 이메일 |
| `INQUIRY_FROM_EMAIL` | 선택 | 발신 주소 |

세션 시크릿 생성:

```
openssl rand -base64 32
```

환경변수 추가/변경 후에는 **재배포**해야 반영됩니다.

---

## 5. 배포 후 검증

- `/ko` 접속 → 200, 한글 페이지 정상
- `/en`, `/ja` 언어 전환 동작
- 카톡·인스타에 링크 붙여 OG 미리보기 확인
- `/admin/login` → `ADMIN_PASSWORD`로 로그인 → 대시보드 진입
- 폼 제출 → `/admin`에서 문의 보이는지 (Postgres 저장 확인)
- 서버 로그에 "프로덕션 설정 경고"가 없으면 env 정상

---

## 6. 도메인 (나중에)

Vercel → Settings → Domains → 커스텀 도메인 추가 → DNS 안내대로 설정.
연결 후 `NEXT_PUBLIC_SITE_URL`을 그 도메인으로 변경 → 재배포.

---

## 참고

- 빌드: `npm run build` (로컬 검증), 32개 정적 페이지 + 동적 라우트(`/admin`, `/api/inquiry`)
- Node: `.nvmrc` = 22 (engines: >=20)
- 로컬 개발: `npm run dev` (POSTGRES_URL 없으면 `.data/`에 JSON 저장)
