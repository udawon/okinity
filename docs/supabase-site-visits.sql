-- 방문자 카운터 테이블 (2026-09-28)
-- 사용: Supabase 대시보드 > SQL Editor 에 붙여넣고 RUN (최초 1회).
--
-- 하루에 방문자 1명 = 1행. visitor 는 (날짜|IP|브라우저)를 비밀키로 해시한 값이라
-- IP 원문을 저장하지 않고, 날짜가 바뀌면 같은 사람도 다른 값이 된다(추적 불가).
--   오늘 방문자 = 오늘 날짜 행 수, 누적 방문자 = 전체 행 수(일별 방문자의 합).

create table if not exists site_visits (
  day        date        not null,
  visitor    text        not null,
  created_at timestamptz not null default now(),
  primary key (day, visitor)
);

-- RLS 켜고 정책은 두지 않는다 → 공개 키로는 읽기·쓰기 불가, 서버(service_role)만 접근.
alter table site_visits enable row level security;
