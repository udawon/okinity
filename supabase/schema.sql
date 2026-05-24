-- PONYOKINAWA 콘텐츠 CMS 스키마 (Supabase)
-- 사용: Supabase 대시보드 > SQL Editor 에 붙여넣고 RUN.
--
-- 설계: 영역별 콘텐츠를 key-value(JSONB)로 저장하는 단일 테이블.
--   key 예) 'hero', 'gallery', 'product:experience', 'signature:/diving'
--   value 예) { "title": "...", "mediaUrl": "https://.../media/hero.jpg", ... }
-- 메인 페이지는 content/*.md(기본값) + 이 테이블(오버라이드)을 머지해 렌더.

create table if not exists site_content (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_site_content_updated_at on site_content;
create trigger trg_site_content_updated_at
  before update on site_content
  for each row execute function set_updated_at();

-- RLS: 공개 읽기 허용(메인 페이지). 쓰기는 service_role(RLS 우회)만 → 어드민 서버액션 전용.
alter table site_content enable row level security;

drop policy if exists "public read site_content" on site_content;
create policy "public read site_content"
  on site_content for select
  using (true);

-- ── Storage 버킷 (이미지·동영상) ──────────────────────────────────
-- public 버킷: 누구나 URL로 읽기 가능, 업로드는 service_role(어드민)만.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- public 버킷은 읽기가 기본 공개. 업로드/삭제는 service_role 키(어드민 서버액션)로만 수행.
