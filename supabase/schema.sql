-- ============================================================
-- VIA 강점 피드백 앱 — 전체 스키마
--
-- 실행 방법
--   Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run
--   여러 번 실행해도 같은 상태가 되도록 작성했다 (drop/if not exists)
--
-- 실행 전에 반드시 처리할 것
--   이 파일 맨 아래 admin_allowlist seed 에 본인 이메일을 넣는다
--
-- 채워 넣을 비밀값은 없다. 붙여넣고 그대로 실행하면 된다.
-- ============================================================


-- ------------------------------------------------------------
-- 1. 확장
-- ------------------------------------------------------------

-- extensions 스키마에 설치한다. public 에 들어가면 pgcrypto 의 모든 함수가
-- PUBLIC 실행 권한을 달고 anon 이 호출 가능한 RPC 로 노출된다
create extension if not exists pgcrypto with schema extensions;


-- ------------------------------------------------------------
-- 1-1. 이전 버전 정리 — 기기 식별 장치를 걷어낸다
--
-- 기기별 중복을 '차단'한 적은 없었다. 차단은 submission_key 가 한다.
-- client_hash 는 "이전에 남김" 표시와 관리자 중복 점검에만 쓰였는데,
-- 식별자 자체가 localStorage 에 있어서 서버에 물어봐도 얻는 게 없었다.
-- 중복 점검 화면을 포기하고 전부 지운다. pepper 관리 부담이 사라진다.
--
-- 이 블록이 없으면 재실행이 깨진다.
-- 기존 DB 에는 client_hash 가 not null 로 남아 있어서
-- 새 submit_feedback 의 INSERT 가 제약 위반으로 실패한다.
-- ------------------------------------------------------------

-- 옛 시그니처를 명시적으로 지운다.
-- create or replace 는 인자가 다르면 새 오버로드를 만들 뿐 옛것을 지우지 않는다
drop function if exists public.submit_feedback(uuid, text, text, uuid, jsonb);
drop function if exists public.get_my_submissions(text);
drop function if exists public.device_pepper();

-- 컬럼을 지우면 딸린 인덱스도 함께 사라진다
alter table if exists public.feedbacks drop column if exists client_hash;

drop table if exists public.app_config;


-- ------------------------------------------------------------
-- 2. 테이블
-- ------------------------------------------------------------

-- 피드백을 받는 대상자. 동명이인을 허용하므로 unique 제약을 두지 않는다
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  group_name  text null check (group_name is null or char_length(btrim(group_name)) between 1 and 40),
  created_by  text null,
  -- 관리자가 숨긴 시각. null 이면 참여 대상이다.
  -- 잘못 등록했거나 빠진 사람을 목록·집계에서 빼되 받은 글은 지우지 않는다.
  -- 숨긴 사람은 결과 공개 게이트에서도 빠진다. 안 그러면 한 명이 영영 막는다
  hidden_at   timestamptz null,
  created_at  timestamptz not null default now()
);

-- 이미 만들어진 DB 에도 넣는다
alter table public.people add column if not exists hidden_at timestamptz null;

-- VIA 24개 마스터. 화면 문구의 원본은 src/lib/strengths.ts 이고
-- 여기 description 은 참고용이다 (문구 수정에 마이그레이션이 필요 없도록)
create table if not exists public.strengths (
  code        text primary key,
  name_ko     text not null,
  name_en     text not null,
  virtue      text not null check (
                virtue in ('wisdom','courage','humanity','justice','temperance','transcendence')
              ),
  description text null,
  sort_order  int not null
);

-- 제출 1건
create table if not exists public.feedbacks (
  id             uuid primary key default gen_random_uuid(),
  person_id      uuid not null references public.people(id) on delete cascade,
  author_name    text null check (author_name is null or char_length(btrim(author_name)) between 1 and 20),
  -- 멱등 키. 같은 키로 두 번 오면 두 번째는 무시된다.
  -- 중복 제출을 막는 것은 이 키 하나다. 기기를 식별하지 않는다
  submission_key uuid not null unique,
  -- 관리자가 제외 처리한 시각. null 이면 정상
  excluded_at    timestamptz null,
  created_at     timestamptz not null default now()
);

-- 제출에 포함된 개별 강점 + 사유
create table if not exists public.feedback_items (
  id            uuid primary key default gen_random_uuid(),
  feedback_id   uuid not null references public.feedbacks(id) on delete cascade,
  strength_code text not null references public.strengths(code),
  reason        text not null check (char_length(btrim(reason)) >= 10),
  unique (feedback_id, strength_code)
);

-- 관리자 이메일 허용목록. 인증(로그인)과 인가(관리자 여부)를 분리한다
create table if not exists public.admin_allowlist (
  email      text primary key check (email = lower(email) and position('@' in email) > 1),
  label      text null,
  added_by   text null,
  created_at timestamptz not null default now()
);

-- 관리자가 여러 명이므로 누가 무엇을 했는지 남긴다.
-- 제출자를 식별할 수 있는 것은 어떤 형태로도 넣지 말 것
create table if not exists public.admin_audit_log (
  id          bigserial primary key,
  admin_email text not null,
  action      text not null check (
                action in ('login','import_people','exclude_feedback','restore_feedback',
                           'add_admin','remove_admin','hide_person','restore_person','delete_person')
              ),
  detail      jsonb null,
  created_at  timestamptz not null default now()
);

-- 이미 만들어진 DB 는 위 CHECK 이 적용되지 않는다 (create table if not exists).
-- 동작을 추가할 때마다 제약을 갈아끼운다. 이름을 직접 지어 다시 찾을 수 있게 한다
alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_allowed;
alter table public.admin_audit_log add constraint admin_audit_log_action_allowed check (
  action in ('login','import_people','exclude_feedback','restore_feedback',
             'add_admin','remove_admin','hide_person','restore_person','delete_person')
);


-- ------------------------------------------------------------
-- 3. 인덱스
-- ------------------------------------------------------------

create index if not exists people_group_name_idx
  on public.people (group_name);

create index if not exists feedbacks_person_idx
  on public.feedbacks (person_id);

create index if not exists feedbacks_person_active_idx
  on public.feedbacks (person_id) where excluded_at is null;

create index if not exists feedback_items_feedback_idx
  on public.feedback_items (feedback_id);

create index if not exists feedback_items_strength_idx
  on public.feedback_items (strength_code);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);


-- ------------------------------------------------------------
-- 4. 권한 판정 함수
--
-- 로그인만으로는 관리자가 아니다. 허용목록에 있어야 관리자다.
-- security definer 라서 admin_allowlist 의 RLS 와 무관하게 조회하며,
-- 소유자(postgres)로 실행되므로 정책이 자기 자신을 재귀 호출하지 않는다.
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_allowlist
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

-- 관리자 전용 뷰에서 쓴다. 관리자가 아니면 빈 결과가 아니라 오류로 끝낸다
create or replace function public.assert_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only'
      using errcode = '42501';
  end if;
  return true;
end;
$$;


-- ------------------------------------------------------------
-- 5. 결과 공개 게이트 (4장)
--
-- 등록된 모든 사람이 각자 5개 이상의 강점을 받았을 때 비로소 열린다.
-- 한 명이라도 미달이면 누구의 그래프도 열리지 않는다.
-- ------------------------------------------------------------

create or replace function public.results_unlocked()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  with counts as (
    select p.id, count(i.id) as strength_count
    from public.people p
    left join public.feedbacks f
      on f.person_id = p.id and f.excluded_at is null
    left join public.feedback_items i
      on i.feedback_id = f.id
    where p.hidden_at is null
    group by p.id
  )
  select count(*) > 0 and count(*) filter (where strength_count >= 5) = count(*)
  from counts;
$$;

-- 아직 5개를 못 채운 사람 수만. 이름·건수는 절대 내보내지 않는다
create or replace function public.results_remaining()
returns int
language sql
security definer
stable
set search_path = ''
as $$
  with counts as (
    select p.id, count(i.id) as strength_count
    from public.people p
    left join public.feedbacks f
      on f.person_id = p.id and f.excluded_at is null
    left join public.feedback_items i
      on i.feedback_id = f.id
    where p.hidden_at is null
    group by p.id
  )
  select count(*)::int from counts where strength_count < 5;
$$;


-- ------------------------------------------------------------
-- 6. 뷰
--
-- 2단 구조로 나눈다.
--   *_internal : 건수 포함. anon SELECT 금지. 관리자만
--   *_ratio    : 비율만. anon 이 읽는 공개 뷰. cnt 컬럼이 아예 없다
--
-- 공개 뷰는 게이트가 닫혀 있으면 행 자체를 반환하지 않는다.
-- 앱에서 조건 분기하는 것으로는 부족하고, anon 키로 직접 조회해도 막혀야 한다.
-- ------------------------------------------------------------

drop view if exists public.feedback_items_active cascade;
drop view if exists public.person_totals_internal cascade;
drop view if exists public.group_totals_internal cascade;
drop view if exists public.results_status cascade;
drop view if exists public.person_strength_ratio cascade;
drop view if exists public.person_virtue_ratio cascade;
drop view if exists public.overall_strength_ratio cascade;
drop view if exists public.overall_virtue_ratio cascade;
drop view if exists public.group_strength_ratio cascade;
drop view if exists public.group_virtue_ratio cascade;
drop view if exists public.feedback_reasons_public cascade;

-- (내부 전용) 제외되지 않은 제출의 강점 항목. 다른 뷰들의 공통 재료
create view public.feedback_items_active as
select
  f.id                                    as feedback_id,
  f.person_id,
  coalesce(p.group_name, '미지정')        as group_name,
  i.id                                    as item_id,
  i.strength_code,
  i.reason,
  f.author_name,
  f.created_at
from public.feedbacks f
join public.people p         on p.id = f.person_id
join public.feedback_items i on i.feedback_id = f.id
where f.excluded_at is null
  and p.hidden_at is null;

-- (관리자 전용) 수신 현황. 관리자는 누가 몇 개를 받았는지 모두 볼 수 있다
create view public.person_totals_internal as
select t.*
from (
  select
    p.id                                   as person_id,
    p.name,
    coalesce(p.group_name, '미지정')       as group_name,
    p.created_by,
    -- 숨긴 사람도 돌려준다. 관리자가 보고 되돌릴 수 있어야 한다
    p.hidden_at,
    count(distinct f.id)::int              as submission_count,
    count(i.id)::int                       as strength_count
  from public.people p
  left join public.feedbacks f
    on f.person_id = p.id and f.excluded_at is null
  left join public.feedback_items i
    on i.feedback_id = f.id
  group by p.id, p.name, p.group_name, p.created_by, p.hidden_at
) t
where public.assert_admin();

-- (관리자 전용) 조별 합계. 조 필터와 조별 비교가 프론트 필터링 대신 이걸 쓴다
create view public.group_totals_internal as
select t.*
from (
  select
    coalesce(p.group_name, '미지정')       as group_name,
    count(distinct p.id)::int              as person_count,
    count(i.id)::int                       as strength_count
  from public.people p
  left join public.feedbacks f
    on f.person_id = p.id and f.excluded_at is null
  left join public.feedback_items i
    on i.feedback_id = f.id
  where p.hidden_at is null
  group by coalesce(p.group_name, '미지정')
) t
where public.assert_admin();

-- anon 이 읽는 유일한 상태 뷰. 컬럼은 두 개뿐이다
create view public.results_status as
select
  public.results_unlocked() as unlocked,
  public.results_remaining() as remaining;

-- ------------------------------------------------------------
-- 비율 눈금 — 5% 단위
--
-- 비율을 1% 단위로 내려주면 받은 건수를 역산할 수 있다.
-- 8% 는 12건 중 1건, 4% 는 25건 중 1건으로 금세 좁혀진다.
-- 그래서 5% 눈금(20칸) 위에 올려서 내보낸다.
--
-- 각자 가까운 5의 배수로 반올림하면 합계가 95~105 로 흩어져
-- 덕목별 보기의 소계와 그 아래 막대들의 합이 어긋나 보인다.
-- 그래서 100칸이 아니라 20칸 위에서 최대잔여법을 쓴다.
-- 결과는 전부 5의 배수이면서 합이 정확히 100 이다.
--
--   20칸 중 몇 칸인지 내림 → 남은 칸을 소수부가 큰 순서로 하나씩 → ×5
--
-- ⚠ 눈금을 키워도 표본이 작으면 가려지지 않는다.
--   5개를 받은 사람은 한 개가 정확히 20% 라서 "5개 중 1개" 가 그대로 드러난다.
--   이건 눈금이 아니라 참여 인원으로 풀어야 하는 문제다.
--
-- 5% 에 못 미쳐 0% 가 된 강점도 행은 남긴다.
-- 화면에서 막대 대신 이름만 모아 보여주기 위해서다.
-- (아예 선택되지 않은 강점은 행 자체가 없다)
-- ------------------------------------------------------------

-- 개인 · 강점별 비율
create view public.person_strength_ratio as
with base as (
  select person_id, strength_code, count(*)::numeric as c
  from public.feedback_items_active
  group by person_id, strength_code
),
tot as (
  select person_id, sum(c) as total from base group by person_id
),
frac as (
  select
    b.person_id,
    b.strength_code,
    floor(20.0 * b.c / t.total)::int                     as base_units,
    20.0 * b.c / t.total - floor(20.0 * b.c / t.total)   as rem
  from base b join tot t on t.person_id = b.person_id
),
ranked as (
  select
    person_id,
    strength_code,
    base_units,
    row_number() over (partition by person_id order by rem desc, strength_code) as rn,
    20 - sum(base_units) over (partition by person_id)                          as leftover
  from frac
)
select
  r.person_id,
  r.strength_code,
  s.name_ko,
  s.virtue,
  (r.base_units + case when r.rn <= r.leftover then 1 else 0 end) * 5 as ratio
from ranked r
join public.strengths s on s.code = r.strength_code
where public.results_unlocked();

-- 개인 · 덕목별 비율
create view public.person_virtue_ratio as
with base as (
  select a.person_id, s.virtue
  from public.feedback_items_active a
  join public.strengths s on s.code = a.strength_code
),
cnt as (
  select person_id, virtue, count(*)::numeric as c from base group by person_id, virtue
),
tot as (
  select person_id, sum(c) as total from cnt group by person_id
),
frac as (
  select
    c.person_id,
    c.virtue,
    floor(20.0 * c.c / t.total)::int                    as base_units,
    20.0 * c.c / t.total - floor(20.0 * c.c / t.total)  as rem
  from cnt c join tot t on t.person_id = c.person_id
),
ranked as (
  select
    person_id,
    virtue,
    base_units,
    row_number() over (partition by person_id order by rem desc, virtue) as rn,
    20 - sum(base_units) over (partition by person_id)                   as leftover
  from frac
)
select
  person_id,
  virtue,
  (base_units + case when rn <= leftover then 1 else 0 end) * 5 as ratio
from ranked
where public.results_unlocked();

-- 전체 · 강점별 비율
create view public.overall_strength_ratio as
with base as (
  select strength_code, count(*)::numeric as c
  from public.feedback_items_active
  group by strength_code
),
tot as (
  select sum(c) as total from base
),
frac as (
  select
    b.strength_code,
    floor(20.0 * b.c / t.total)::int                     as base_units,
    20.0 * b.c / t.total - floor(20.0 * b.c / t.total)   as rem
  from base b cross join tot t
),
ranked as (
  select
    strength_code,
    base_units,
    row_number() over (order by rem desc, strength_code) as rn,
    20 - sum(base_units) over ()                         as leftover
  from frac
)
select
  r.strength_code,
  s.name_ko,
  s.virtue,
  (r.base_units + case when r.rn <= r.leftover then 1 else 0 end) * 5 as ratio
from ranked r
join public.strengths s on s.code = r.strength_code
where public.results_unlocked();

-- 전체 · 덕목별 비율
create view public.overall_virtue_ratio as
with base as (
  select s.virtue
  from public.feedback_items_active a
  join public.strengths s on s.code = a.strength_code
),
cnt as (
  select virtue, count(*)::numeric as c from base group by virtue
),
tot as (
  select sum(c) as total from cnt
),
frac as (
  select
    c.virtue,
    floor(20.0 * c.c / t.total)::int                    as base_units,
    20.0 * c.c / t.total - floor(20.0 * c.c / t.total)  as rem
  from cnt c cross join tot t
),
ranked as (
  select
    virtue,
    base_units,
    row_number() over (order by rem desc, virtue) as rn,
    20 - sum(base_units) over ()                  as leftover
  from frac
)
select
  virtue,
  (base_units + case when rn <= leftover then 1 else 0 end) * 5 as ratio
from ranked
where public.results_unlocked();

-- 조 · 강점별 비율
create view public.group_strength_ratio as
with base as (
  select group_name, strength_code, count(*)::numeric as c
  from public.feedback_items_active
  group by group_name, strength_code
),
tot as (
  select group_name, sum(c) as total from base group by group_name
),
frac as (
  select
    b.group_name,
    b.strength_code,
    floor(20.0 * b.c / t.total)::int                     as base_units,
    20.0 * b.c / t.total - floor(20.0 * b.c / t.total)   as rem
  from base b join tot t on t.group_name = b.group_name
),
ranked as (
  select
    group_name,
    strength_code,
    base_units,
    row_number() over (partition by group_name order by rem desc, strength_code) as rn,
    20 - sum(base_units) over (partition by group_name)                          as leftover
  from frac
)
select
  r.group_name,
  r.strength_code,
  s.name_ko,
  s.virtue,
  (r.base_units + case when r.rn <= r.leftover then 1 else 0 end) * 5 as ratio
from ranked r
join public.strengths s on s.code = r.strength_code
where public.results_unlocked();

-- 조 · 덕목별 비율
create view public.group_virtue_ratio as
with base as (
  select a.group_name, s.virtue
  from public.feedback_items_active a
  join public.strengths s on s.code = a.strength_code
),
cnt as (
  select group_name, virtue, count(*)::numeric as c from base group by group_name, virtue
),
tot as (
  select group_name, sum(c) as total from cnt group by group_name
),
frac as (
  select
    c.group_name,
    c.virtue,
    floor(20.0 * c.c / t.total)::int                    as base_units,
    20.0 * c.c / t.total - floor(20.0 * c.c / t.total)  as rem
  from cnt c join tot t on t.group_name = c.group_name
),
ranked as (
  select
    group_name,
    virtue,
    base_units,
    row_number() over (partition by group_name order by rem desc, virtue) as rn,
    20 - sum(base_units) over (partition by group_name)                   as leftover
  from frac
)
select
  group_name,
  virtue,
  (base_units + case when rn <= leftover then 1 else 0 end) * 5 as ratio
from ranked
where public.results_unlocked();

-- 사유 목록.
-- 사유 카드 개수를 세면 그 사람이 받은 건수가 되므로 같은 게이트를 적용한다
create view public.feedback_reasons_public as
select
  person_id,
  strength_code,
  reason,
  author_name,
  created_at
from public.feedback_items_active
where public.results_unlocked();


-- ------------------------------------------------------------
-- 7. 권한 (GRANT)
--
-- Supabase 는 public 스키마의 새 객체를 anon/authenticated 에 자동으로
-- 열어주는 기본 권한이 걸려 있다. 그래서 전부 회수한 뒤 필요한 것만 준다.
-- ------------------------------------------------------------

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- people : created_by 는 관리자 이메일이므로 아무에게도 컬럼을 열지 않는다.
-- 관리자는 person_totals_internal 을 통해 본다
--
-- ⚠ hidden_at 은 반드시 이 목록에 있어야 한다.
--   홈 화면이 숨긴 사람을 빼려면 그 컬럼을 읽어야 하는데, 컬럼 단위 권한에서
--   빠지면 select 전체가 42501(permission denied) 로 거절된다.
--   컬럼을 하나 더할 때마다 이 줄을 같이 고쳐야 한다는 뜻이다
grant select (id, name, group_name, hidden_at, created_at) on public.people to anon, authenticated;
grant insert                                              on public.people to authenticated;

-- 숨기기·되돌리기·삭제 (관리자 전용).
--
-- RLS 정책(people_update_admin·people_delete_admin)만으로는 부족하다.
-- 권한이 먼저 걸리고 그다음에 정책을 본다. 정책만 있고 GRANT 가 없으면
-- 관리자여도 42501 로 막힌다.
--
-- update 는 hidden_at 만 연다. 이름·조를 고치는 화면은 아직 없다.
-- 열어둘 이유가 없는 컬럼은 열지 않는다 (feedbacks.excluded_at 과 같은 방식)
grant update (hidden_at) on public.people to authenticated;
grant delete             on public.people to authenticated;

-- strengths : 누구나 읽기
grant select on public.strengths to anon, authenticated;

-- feedbacks / feedback_items : anon 접근 없음. 삽입은 RPC 로만.
-- 관리자 UPDATE 는 컬럼 단위로 excluded_at 만 연다
grant select                on public.feedbacks      to authenticated;
grant update (excluded_at)  on public.feedbacks      to authenticated;
grant select                on public.feedback_items to authenticated;

-- 관리자 전용 테이블
grant select, insert         on public.admin_audit_log to authenticated;
grant usage, select          on sequence public.admin_audit_log_id_seq to authenticated;
grant select, insert, delete on public.admin_allowlist to authenticated;

-- 공개 뷰
grant select on public.results_status          to anon, authenticated;
grant select on public.person_strength_ratio   to anon, authenticated;
grant select on public.person_virtue_ratio     to anon, authenticated;
grant select on public.overall_strength_ratio  to anon, authenticated;
grant select on public.overall_virtue_ratio    to anon, authenticated;
grant select on public.group_strength_ratio    to anon, authenticated;
grant select on public.group_virtue_ratio      to anon, authenticated;
grant select on public.feedback_reasons_public to anon, authenticated;

-- 내부 뷰 : anon 에게 주지 않는다.
-- authenticated 에게만 열되, 뷰 안의 assert_admin() 이 비관리자를 오류로 막는다
grant select on public.person_totals_internal to authenticated;
grant select on public.group_totals_internal  to authenticated;

-- feedback_items_active 는 어떤 역할에도 주지 않는다 (다른 뷰의 재료일 뿐)

-- 함수 실행 권한
revoke all on function public.is_admin()          from public, anon, authenticated;
revoke all on function public.assert_admin()      from public, anon, authenticated;
revoke all on function public.results_unlocked()  from public, anon, authenticated;
revoke all on function public.results_remaining() from public, anon, authenticated;

grant execute on function public.is_admin()          to authenticated;
grant execute on function public.assert_admin()      to authenticated;
grant execute on function public.results_unlocked()  to anon, authenticated;
grant execute on function public.results_remaining() to anon, authenticated;


-- ------------------------------------------------------------
-- 8. RLS
--
-- 모든 테이블 RLS 활성화.
-- UPDATE 는 관리자의 excluded_at 설정·해제만, DELETE 는 admin_allowlist 만.
-- ------------------------------------------------------------

alter table public.people          enable row level security;
alter table public.strengths       enable row level security;
alter table public.feedbacks       enable row level security;
alter table public.feedback_items  enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists people_select_all        on public.people;
drop policy if exists people_insert_admin      on public.people;
drop policy if exists people_update_admin      on public.people;
drop policy if exists people_delete_admin      on public.people;
drop policy if exists strengths_select_all     on public.strengths;
drop policy if exists feedbacks_select_admin   on public.feedbacks;
drop policy if exists feedbacks_update_admin   on public.feedbacks;
drop policy if exists feedback_items_select_admin on public.feedback_items;
drop policy if exists allowlist_select_admin   on public.admin_allowlist;
drop policy if exists allowlist_insert_admin   on public.admin_allowlist;
drop policy if exists allowlist_delete_admin   on public.admin_allowlist;
drop policy if exists audit_select_admin       on public.admin_audit_log;
drop policy if exists audit_insert_admin       on public.admin_audit_log;

-- people : 누구나 읽기, 등록은 관리자만. created_by 를 남의 이름으로 채울 수 없다
create policy people_select_all on public.people
  for select to anon, authenticated using (true);

create policy people_insert_admin on public.people
  for insert to authenticated
  with check (
    public.is_admin()
    and (created_by is null or created_by = lower(auth.jwt() ->> 'email'))
  );

-- 숨김·되돌리기. 이름과 조를 고치는 것도 관리자만 할 수 있다
create policy people_update_admin on public.people
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 삭제. 지우면 그 사람이 받은 제출과 사유도 cascade 로 함께 사라진다.
-- 되돌릴 수 없으므로 화면에서 몇 개가 같이 지워지는지 보여준 뒤에 부른다
create policy people_delete_admin on public.people
  for delete to authenticated
  using (public.is_admin());

-- strengths : 읽기 전용 마스터
create policy strengths_select_all on public.strengths
  for select to anon, authenticated using (true);

-- feedbacks : anon 정책 없음(= 접근 불가). 관리자만 읽고, excluded_at 만 고친다
create policy feedbacks_select_admin on public.feedbacks
  for select to authenticated using (public.is_admin());

create policy feedbacks_update_admin on public.feedbacks
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy feedback_items_select_admin on public.feedback_items
  for select to authenticated using (public.is_admin());

-- admin_allowlist : 관리자만. 자기 이름으로만 추가 기록을 남긴다
create policy allowlist_select_admin on public.admin_allowlist
  for select to authenticated using (public.is_admin());

create policy allowlist_insert_admin on public.admin_allowlist
  for insert to authenticated
  with check (
    public.is_admin()
    and (added_by is null or added_by = lower(auth.jwt() ->> 'email'))
  );

create policy allowlist_delete_admin on public.admin_allowlist
  for delete to authenticated using (public.is_admin());

-- admin_audit_log : 관리자만. 다른 관리자 이름으로 기록을 남길 수 없다
create policy audit_select_admin on public.admin_audit_log
  for select to authenticated using (public.is_admin());

create policy audit_insert_admin on public.admin_audit_log
  for insert to authenticated
  with check (
    public.is_admin()
    and admin_email = lower(auth.jwt() ->> 'email')
  );


-- ------------------------------------------------------------
-- 8-1. 마지막 관리자 보호
--
-- 앱에서만 막으면 두 가지로 뚫린다.
--   1) 두 관리자가 동시에 서로를 지우면 둘 다 "아직 2명" 을 보고 통과한다
--   2) 관리자는 자기 브라우저의 토큰으로 PostgREST 에 직접 DELETE 를 날릴 수 있다
-- 아무도 못 들어가는 상태가 되면 service_role 키를 쓰지 않는 이 앱은
-- 스스로 복구할 수 없으므로, 규칙을 DB 에 둔다.
--
-- 문(statement) 단위 after 트리거를 쓴다. 행 단위 before 트리거는 같은 문에서
-- 지워지는 다른 행을 아직 못 보기 때문에 `delete ... where email <> 'x'` 한 방에 뚫린다.
-- ------------------------------------------------------------

create or replace function public.prevent_last_admin_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 동시에 들어온 삭제를 줄 세운다. 없으면 서로 상대의 삭제를 못 보고 둘 다 통과한다
  perform pg_advisory_xact_lock(918273645);

  if (select count(*) from public.admin_allowlist) < 1 then
    raise exception '마지막 관리자는 제거할 수 없어요'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

drop trigger if exists admin_allowlist_keep_one on public.admin_allowlist;
create trigger admin_allowlist_keep_one
  after delete on public.admin_allowlist
  for each statement execute function public.prevent_last_admin_delete();


-- ------------------------------------------------------------
-- 9. RPC
-- ------------------------------------------------------------

-- 제출. feedbacks 1건 + feedback_items N건을 한 트랜잭션에 넣고 id 를 돌려준다.
-- 같은 submission_key 가 다시 오면 새로 넣지 않고 기존 id 를 그대로 반환한다
create or replace function public.submit_feedback(
  p_person_id      uuid,
  p_author_name    text,
  p_submission_key uuid,
  p_items          jsonb
)
returns uuid
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  v_count         int;
  v_distinct      int;
  v_feedback_id   uuid;
  v_existing_person uuid;
begin
  if p_person_id is null or p_submission_key is null then
    raise exception 'person_id and submission_key are required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a json array';
  end if;

  -- 항목의 모양을 먼저 본다. 여기서 걸러야 제약 위반 코드 대신 읽을 수 있는 메시지가 나간다
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where jsonb_typeof(item) <> 'object'
       or item ->> 'code' is null
       or item ->> 'reason' is null
  ) then
    raise exception 'each item must be an object with code and reason';
  end if;

  select count(*)::int, count(distinct item ->> 'code')::int
  into v_count, v_distinct
  from jsonb_array_elements(p_items) as item;

  if v_count < 1 or v_count > 5 then
    raise exception 'items count must be between 1 and 5';
  end if;

  -- 같은 강점을 두 번 넣으면 개수 검사를 통과해버리므로 따로 막는다
  if v_distinct <> v_count then
    raise exception 'items must not repeat the same strength';
  end if;

  -- 멱등 처리. 같은 키가 다시 오면 새로 넣지 않고 기존 id 를 그대로 돌려준다
  select id, person_id into v_feedback_id, v_existing_person
  from public.feedbacks
  where submission_key = p_submission_key;

  if v_feedback_id is not null then
    -- 같은 키를 다른 대상에게 재사용했다면 조용히 버리지 말고 알린다
    if v_existing_person <> p_person_id then
      raise exception 'submission_key already used for another person';
    end if;
    return v_feedback_id;
  end if;

  -- 제출자를 식별하는 값은 저장하지 않는다.
  -- 누가 남겼는지는 author_name 을 스스로 적었을 때만 남는다
  insert into public.feedbacks (person_id, author_name, submission_key)
  values (
    p_person_id,
    nullif(btrim(coalesce(p_author_name, '')), ''),
    p_submission_key
  )
  on conflict (submission_key) do nothing
  returning id into v_feedback_id;

  -- 동시에 같은 키가 들어온 경우
  if v_feedback_id is null then
    select id into v_feedback_id
    from public.feedbacks
    where submission_key = p_submission_key;
    return v_feedback_id;
  end if;

  insert into public.feedback_items (feedback_id, strength_code, reason)
  select
    v_feedback_id,
    item ->> 'code',
    btrim(item ->> 'reason')
  from jsonb_array_elements(p_items) as item;

  return v_feedback_id;
end;
$$;

-- "이전에 남김" 표시는 서버에 묻지 않는다.
--
-- 기기를 식별하려면 그 값을 브라우저에 저장해야 하는데, 그 저장소가
-- localStorage 다. 저장소를 지우면 식별자도 같이 사라지므로
-- 서버에 물어봐도 돌아오는 게 없다. 그래서 목록 자체를 localStorage 에 둔다.
-- (STORAGE_KEYS — src/lib/constants.ts)
--
-- 그 대신 서버에는 제출자를 식별하는 값이 하나도 남지 않는다.

revoke all on function public.submit_feedback(uuid, text, uuid, jsonb)
  from public, anon, authenticated;

grant execute on function public.submit_feedback(uuid, text, uuid, jsonb)
  to anon, authenticated;


-- ------------------------------------------------------------
-- 10. seed — VIA 24 강점
--
-- 화면에 쓰이는 문구의 원본은 src/lib/strengths.ts 다.
-- 여기 description 은 참고용이므로 문구를 고쳐도 마이그레이션이 필요 없다.
-- ------------------------------------------------------------

insert into public.strengths (code, name_ko, name_en, virtue, description, sort_order) values
  ('creativity',             '창의성',   'Creativity',                         'wisdom',         '새롭고 쓸모 있는 방법을 떠올려요',      1),
  ('curiosity',              '호기심',   'Curiosity',                          'wisdom',         '모르는 걸 그냥 지나치지 않아요',        2),
  ('judgment',               '판단력',   'Judgment',                           'wisdom',         '모든 면을 따져보고 결정해요',          3),
  ('love_of_learning',       '학구열',   'Love of Learning',                   'wisdom',         '배우는 것 자체를 즐겨요',              4),
  ('perspective',            '통찰',     'Perspective',                        'wisdom',         '큰 그림으로 조언해줘요',               5),
  ('bravery',                '용감성',   'Bravery',                            'courage',        '두려워도 옳은 일을 해요',              6),
  ('perseverance',           '끈기',     'Perseverance',                       'courage',        '시작한 일을 끝까지 해내요',            7),
  ('honesty',                '진실성',   'Honesty',                            'courage',        '꾸미지 않고 진실하게 말해요',          8),
  ('zest',                   '활력',     'Zest',                               'courage',        '에너지가 있고 함께 있으면 신나요',      9),
  ('kindness',               '친절',     'Kindness',                           'humanity',       '먼저 챙기고 베풀어요',                 10),
  ('love',                   '사랑',     'Love',                               'humanity',       '가까운 사람과 깊이 이어져요',          11),
  ('social_intelligence',    '사회지능', 'Social Intelligence',                'humanity',       '분위기와 마음을 잘 읽어요',            12),
  ('teamwork',               '협동심',   'Teamwork',                           'justice',        '함께할 때 더 잘해요',                  13),
  ('fairness',               '공정성',   'Fairness',                           'justice',        '모두를 똑같이 대해요',                 14),
  ('leadership',             '리더십',   'Leadership',                         'justice',        '사람들을 모으고 이끌어요',             15),
  ('forgiveness',            '용서',     'Forgiveness',                        'temperance',     '잘못을 오래 담아두지 않아요',          16),
  ('humility',               '겸손',     'Humility',                           'temperance',     '굳이 드러내지 않아요',                 17),
  ('prudence',               '신중성',   'Prudence',                           'temperance',     '나중을 생각하고 선택해요',             18),
  ('self_regulation',        '자기통제력','Self-Regulation',                   'temperance',     '감정과 습관을 스스로 다스려요',        19),
  ('appreciation_of_beauty', '감상력',   'Appreciation of Beauty & Excellence', 'transcendence', '좋은 것을 알아보고 감탄해요',          20),
  ('gratitude',              '감사',     'Gratitude',                          'transcendence',  '고마움을 알고 표현해요',               21),
  ('hope',                   '희망',     'Hope',                               'transcendence',  '잘될 거라 믿고 나아가요',              22),
  ('humor',                  '유머감각', 'Humor',                              'transcendence',  '웃음을 만들어줘요',                    23),
  ('spirituality',           '영성',     'Spirituality',                       'transcendence',  '삶의 의미와 더 큰 것을 생각해요',      24)
on conflict (code) do update set
  name_ko     = excluded.name_ko,
  name_en     = excluded.name_en,
  virtue      = excluded.virtue,
  description = excluded.description,
  sort_order  = excluded.sort_order;


-- ------------------------------------------------------------
-- 11. seed — 최초 관리자 (부트스트랩)
--
-- 여기 한 명만 넣으면 그 사람이 /admin/settings 에서 나머지를 추가한다.
-- 반드시 소문자로 넣을 것.
-- ------------------------------------------------------------

-- TODO: 본인 이메일
insert into public.admin_allowlist (email, label, added_by) values
  ('sky339128@gmail.com', '관리자', null)
on conflict (email) do nothing;


-- ------------------------------------------------------------
-- 12. PostgREST 스키마 캐시 새로고침
-- ------------------------------------------------------------

notify pgrst, 'reload schema';


-- ============================================================
-- 실행 후 확인 (선택)
--
--   select * from public.results_status;    -- unlocked=false, remaining=0
--   select count(*) from public.strengths;  -- 24
--   select * from public.admin_allowlist;   -- 본인 이메일 1건
--
--   -- 비율이 전부 5의 배수이고 사람별 합이 정확히 100 인지
--   select person_id, sum(ratio) as total, bool_and(ratio % 5 = 0) as on_grid
--   from public.person_strength_ratio group by person_id;
--   -- 게이트가 잠겨 있으면 0행이 나온다. 정상이다
-- ============================================================
