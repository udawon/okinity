-- GEO 측정(유입 경로·AI 크롤러·AI 답변 기록) — 2026-11-18
-- 사용: Supabase 대시보드 > SQL Editor 에 붙여넣고 RUN (최초 1회). 여러 번 실행해도 안전(if not exists).
-- 기존 데이터는 그대로 두고 칸·표만 추가한다.

-- 1) 방문 유입 경로 — 그날 첫 방문의 유입처 이름(예: chatgpt, naver, direct). 주소 전체는 저장하지 않는다.
alter table site_visits add column if not exists source text;

-- 2) 예약 문의 유입 경로 — 처음 들어온 경로(30일 기억)·문의 직전 경로
alter table public.inquiries add column if not exists source_first text;
alter table public.inquiries add column if not exists source_last text;

-- 3) AI·검색 크롤러 방문 — 하루·봇·주소당 1행(같은 날 같은 주소 재방문은 무시)
create table if not exists crawler_visits (
  day        date        not null,
  bot        text        not null,
  path       text        not null,
  created_at timestamptz not null default now(),
  primary key (day, bot, path)
);
alter table crawler_visits enable row level security;

-- 4) AI 답변 기록(월 1회 수동) — 질문·플랫폼별 언급·출처·추천
create table if not exists geo_checks (
  id           uuid        primary key default gen_random_uuid(),
  checked_on   date        not null,
  platform     text        not null,
  question     text        not null,
  mentioned    boolean     not null default false,
  cited        boolean     not null default false,
  recommended  boolean     not null default false,
  cited_url    text,
  competitors  text,
  summary      text,
  created_at   timestamptz not null default now()
);
create index if not exists geo_checks_checked_on_idx on geo_checks (checked_on desc);

-- RLS 켜고 정책은 두지 않는다 → 공개 키로는 읽기·쓰기 불가, 서버(service_role)만 접근.
alter table geo_checks enable row level security;
