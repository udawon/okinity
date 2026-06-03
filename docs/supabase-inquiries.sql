-- 예약 문의(inquiries) 테이블 — Supabase 통합용.
-- Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣고 Run (최초 1회).
-- supabase-js는 DDL을 지원하지 않으므로 테이블 생성은 여기서 수동 1회 실행한다.

create table if not exists public.inquiries (
  id          text primary key,
  created_at  timestamptz not null default now(),
  product     text,
  date        text,
  people      integer,
  name        text not null,
  contact     text not null,
  message     text,
  status      text not null default 'new',
  note        text,  -- 운영자 내부 메모(고객 비노출)
  time        text   -- 방문자 희망 시간대(오전·오후·종일 등)
);

-- 이미 테이블을 만든 경우(컬럼 추가): 아래 두 줄만 실행해도 된다.
alter table public.inquiries add column if not exists note text;
alter table public.inquiries add column if not exists time text;

-- 어드민 목록 정렬(최신순) 최적화
create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

-- RLS 활성화: 익명/공개 키로는 접근 불가.
-- 서버는 service_role 키로 접근하며 service_role은 RLS를 우회하므로 정책 없이도 동작한다.
-- (정책을 추가하지 않음 = 공개 키로는 읽기/쓰기 전면 차단 → 안전)
alter table public.inquiries enable row level security;
