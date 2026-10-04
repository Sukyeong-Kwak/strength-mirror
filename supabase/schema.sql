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
  -- 숨긴 사람은 결과와 집계에서도 빠진다
  hidden_at   timestamptz null,
  created_at  timestamptz not null default now()
);

-- 이미 만들어진 DB 에도 넣는다
alter table public.people add column if not exists hidden_at timestamptz null;

-- 예시 인물인지. 설명하는 동안 보여줄 가상의 사람들이다.
-- 예시 모드에서는 예시만, 실제 모드에서는 실제 사람만 참여자 화면에 나온다
alter table public.people add column if not exists is_demo boolean not null default false;

-- 지금 참여자 화면이 예시를 보여주는지, 실제 참여를 보여주는지. 한 행만 있다.
-- 처음 값은 live 라서 이 기능을 쓰지 않으면 아무것도 달라지지 않는다.
-- 바꾸는 것은 관리자 전용 함수 set_app_mode() 로만 한다
create table if not exists public.app_state (
  id         boolean primary key default true check (id),
  mode       text not null default 'live' check (mode in ('demo', 'live')),
  updated_by text null,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id) values (true) on conflict (id) do nothing;

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
                           'add_admin','remove_admin','hide_person','restore_person','delete_person',
             'add_person','edit_person',
             'seed_demo','clear_demo','set_mode')
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
             'add_admin','remove_admin','hide_person','restore_person','delete_person',
             'add_person','edit_person',
             'seed_demo','clear_demo','set_mode')
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


-- 이 사람이 지금 참여자 화면에 나올 차례인지.
-- 예시 모드면 예시 인물만, 실제 모드면 실제 인물만 true.
-- 뷰와 제출 함수가 같은 판정을 쓰도록 한 곳에 둔다
create or replace function public.in_current_mode(p_is_demo boolean)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(p_is_demo, false) = coalesce(
    (select mode = 'demo' from public.app_state where id),
    false
  );
$$;


-- ------------------------------------------------------------
-- 5. 결과 공개 게이트 — 없앴다
--
-- 처음에는 모두가 5개씩 받아야 결과가 열렸다. 지금은 전체 집계와
-- 서로의 결과를 언제든 볼 수 있다. 대신 누가 남겼는지는 어디에도 내보내지 않는다.
--
-- 옛 함수를 지운다. cascade 라서 이 함수를 쓰던 뷰도 함께 지워지고,
-- 아래 6장에서 게이트 없이 다시 만든다
-- ------------------------------------------------------------

drop function if exists public.results_unlocked() cascade;
drop function if exists public.results_remaining() cascade;


-- ------------------------------------------------------------
-- 6. 뷰
--
-- 2단 구조로 나눈다.
--   *_internal : 건수 포함. anon SELECT 금지. 관리자만
--   *_ratio    : 비율만. anon 이 읽는 공개 뷰. cnt 컬럼이 아예 없다
--
-- 공개 뷰는 언제나 열려 있다. 대신 작성자 이름은 어떤 공개 뷰에도 없다.
-- 화면에서 가리는 것으로는 부족하고, anon 키로 직접 조회해도 나오지 않아야 한다.
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
  f.created_at
from public.feedbacks f
join public.people p         on p.id = f.person_id
join public.feedback_items i on i.feedback_id = f.id
where f.excluded_at is null
  and p.hidden_at is null
  and public.in_current_mode(p.is_demo);

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
    -- 예시 인물도 돌려준다. 화면이 '예시' 로 표시하고 현황에서는 지금 모드만 센다
    p.is_demo,
    count(distinct f.id)::int              as submission_count,
    count(i.id)::int                       as strength_count
  from public.people p
  left join public.feedbacks f
    on f.person_id = p.id and f.excluded_at is null
  left join public.feedback_items i
    on i.feedback_id = f.id
  group by p.id, p.name, p.group_name, p.created_by, p.hidden_at, p.is_demo
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
    and public.in_current_mode(p.is_demo)
  group by coalesce(p.group_name, '미지정')
) t
where public.assert_admin();

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
join public.strengths s on s.code = r.strength_code;

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
from ranked;

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
join public.strengths s on s.code = r.strength_code;

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
from ranked;

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
join public.strengths s on s.code = r.strength_code;

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
from ranked;

-- 사유 목록.
-- 누가 남겼는지(author_name)는 내보내지 않는다. 화면은 모두 익명으로 보여준다
create view public.feedback_reasons_public as
select
  person_id,
  strength_code,
  reason,
  created_at
from public.feedback_items_active;


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
grant select (id, name, group_name, hidden_at, is_demo, created_at) on public.people to anon, authenticated;
grant insert                                              on public.people to authenticated;

-- 숨기기·되돌리기·이름과 조 고치기·삭제 (관리자 전용).
--
-- RLS 정책(people_update_admin·people_delete_admin)만으로는 부족하다.
-- 권한이 먼저 걸리고 그다음에 정책을 본다. 정책만 있고 GRANT 가 없으면
-- 관리자여도 42501 로 막힌다.
--
-- update 는 hidden_at 과 name, group_name 만 연다.
-- created_by·created_at 은 누가 언제 등록했는지의 기록이라 고칠 수 없게 둔다
grant update (hidden_at, name, group_name) on public.people to authenticated;
grant delete             on public.people to authenticated;

-- strengths : 누구나 읽기
grant select on public.strengths to anon, authenticated;

-- app_state : 누구나 읽기. 바꾸기는 set_app_mode() 로만
grant select on public.app_state to anon, authenticated;

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

grant execute on function public.is_admin()          to authenticated;
grant execute on function public.assert_admin()      to authenticated;

-- 공개 뷰가 부른다. 뷰 안의 함수는 뷰를 읽는 쪽의 권한으로 실행되므로 anon 에게도 연다
revoke all on function public.in_current_mode(boolean) from public, anon, authenticated;
grant execute on function public.in_current_mode(boolean) to anon, authenticated;


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
alter table public.app_state       enable row level security;

drop policy if exists app_state_select_all     on public.app_state;
create policy app_state_select_all on public.app_state
  for select to anon, authenticated using (true);

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

  -- 숨긴 사람, 지금 모드가 아닌 사람에게는 남길 수 없다.
  -- 이 함수는 security definer 라 RLS 를 지나치므로 여기서 막는다
  if not exists (
    select 1 from public.people
    where id = p_person_id
      and hidden_at is null
      and public.in_current_mode(is_demo)
  ) then
    raise exception 'person not available';
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
-- 9-1. 예시 데이터와 모드 전환 (관리자 전용)
--
-- 설명하는 동안에는 가상의 사람들로 채운 예시를 보여주고,
-- 진행자가 버튼 하나로 실제 참여자 화면으로 바꾼다.
--
--   seed_demo()      예시를 (다시) 채운다. 있던 예시와 그 위에 남긴 연습 기록은 지운다
--   clear_demo()     예시를 모두 지운다
--   set_app_mode()   'demo' · 'live' 로 바꾼다
--
-- 세 함수 모두 security definer 다. feedbacks 에는 직접 넣는 권한이 없어서
-- 예시 제출을 만들려면 소유자 권한이 필요하다. 그래서 첫 줄에서 관리자인지 본다.
-- 활동 기록도 함수 안에서 남긴다. 화면에서 따로 남기면 실패했을 때 기록만 빠진다.
-- ------------------------------------------------------------

create or replace function public.seed_demo()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin   text := lower(auth.jwt() ->> 'email');
  v_person  uuid;
  v_fb      uuid;
  v_reason  text;
  v_count   int := 0;
  v_index   int := 0;
  r         record;
  i         int;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  -- 다시 채우면 처음 상태로 돌아간다. 연습 삼아 남긴 것도 cascade 로 함께 지워진다
  delete from public.people where is_demo;

  for r in
    select * from (values
      ('김하늘', 'A조', array['kindness','kindness','kindness','gratitude','gratitude','love','humor']),
      ('이도윤', 'A조', array['creativity','creativity','creativity','curiosity','curiosity','humor','zest']),
      ('박서연', 'A조', array['leadership','leadership','fairness','fairness','judgment','perseverance','honesty']),
      ('최민준', 'A조', array['prudence','prudence','self_regulation','self_regulation','humility','perseverance']),
      ('정유진', 'B조', array['kindness','kindness','social_intelligence','social_intelligence','love','gratitude','teamwork']),
      ('강지후', 'B조', array['bravery','bravery','bravery','honesty','honesty','zest','leadership']),
      ('윤수아', 'B조', array['love_of_learning','love_of_learning','curiosity','curiosity','perspective','judgment']),
      ('장현우', 'B조', array['humor','humor','humor','zest','zest','hope','teamwork']),
      ('한예린', 'C조', array['gratitude','gratitude','gratitude','hope','hope','appreciation_of_beauty','kindness']),
      ('오준서', 'C조', array['teamwork','teamwork','teamwork','fairness','kindness','perseverance']),
      ('서지아', 'C조', array['perspective','perspective','judgment','judgment','humility','humility']),
      ('임태윤', 'C조', array['creativity','creativity','appreciation_of_beauty','appreciation_of_beauty','curiosity','humor'])
    ) as t(name, grp, codes)
  loop
    v_index := v_index + 1;

    insert into public.people (name, group_name, is_demo, created_by)
    values (r.name, r.grp, true, v_admin)
    returning id into v_person;

    for i in 1 .. array_length(r.codes, 1) loop
      -- 강점마다 이야기를 두 개씩 두고 번갈아 쓴다. 같은 사람에게 같은 글이 겹치지 않게 한다
      select m.reason into v_reason
      from (values
        ('creativity', 0, '회의가 막혔을 때 전혀 다른 방향의 아이디어를 꺼내서 분위기를 바꿨어요.'),
        ('creativity', 1, '늘 하던 방식 대신 더 간단한 방법을 찾아내는 걸 여러 번 봤어요.'),
        ('curiosity', 0, '처음 듣는 이야기에도 질문을 이어가며 끝까지 알아보려고 하더라고요.'),
        ('curiosity', 1, '새로운 도구가 나오면 먼저 써보고 정리해서 알려줘요.'),
        ('judgment', 0, '결정하기 전에 반대 의견까지 꼼꼼히 들어보는 모습이 인상적이었어요.'),
        ('judgment', 1, '감정이 앞설 때도 사실관계부터 차분히 짚어줬어요.'),
        ('love_of_learning', 0, '주말에 따로 공부한 내용을 즐겁게 이야기해줘요.'),
        ('love_of_learning', 1, '모르는 분야를 배우는 걸 부담이 아니라 재미로 여기는 게 보여요.'),
        ('perspective', 0, '고민을 털어놓았을 때 한 발 떨어져서 큰 그림을 보게 해줬어요.'),
        ('perspective', 1, '복잡한 상황을 몇 마디로 정리해줘서 방향이 잡혔어요.'),
        ('bravery', 0, '모두 망설일 때 불편한 이야기를 먼저 꺼내줬어요.'),
        ('bravery', 1, '처음 해보는 일인데도 손을 들고 맡아준 게 기억나요.'),
        ('perseverance', 0, '일정이 밀려도 포기하지 않고 끝까지 마무리하더라고요.'),
        ('perseverance', 1, '몇 번 막혀도 다시 시도하는 모습에 저도 힘을 얻었어요.'),
        ('honesty', 0, '듣기 좋은 말보다 솔직한 의견을 정중하게 전해줘요.'),
        ('honesty', 1, '자기 실수를 먼저 인정하는 모습이 믿음직했어요.'),
        ('zest', 0, '아침부터 밝은 에너지로 분위기를 띄워줘요.'),
        ('zest', 1, '같이 있으면 일이 덜 힘들게 느껴지는 사람이에요.'),
        ('kindness', 0, '바쁜 와중에도 힘들어 보이는 사람을 먼저 챙기더라고요.'),
        ('kindness', 1, '작은 부탁에도 기꺼이 시간을 내줘서 고마웠어요.'),
        ('love', 0, '가까운 사람들의 이야기를 진심으로 기억하고 물어봐줘요.'),
        ('love', 1, '따뜻하게 곁을 지켜주는 사람이라는 느낌을 받아요.'),
        ('social_intelligence', 0, '말하지 않아도 분위기를 읽고 대화를 자연스럽게 이어줘요.'),
        ('social_intelligence', 1, '처음 온 사람이 어색하지 않게 먼저 말을 걸어줬어요.'),
        ('teamwork', 0, '자기 몫이 끝나도 다른 사람 일을 같이 들여다봐줘요.'),
        ('teamwork', 1, '의견이 갈릴 때 모두가 함께 갈 수 있는 방법을 찾아요.'),
        ('fairness', 0, '누구의 의견이든 같은 무게로 들어주는 게 느껴져요.'),
        ('fairness', 1, '역할을 나눌 때 한쪽에 몰리지 않게 신경 써줬어요.'),
        ('leadership', 0, '흩어진 의견을 모아서 다음 할 일을 분명하게 정해줬어요.'),
        ('leadership', 1, '앞에서 이끌면서도 사람들 이야기를 놓치지 않아요.'),
        ('forgiveness', 0, '서운한 일이 있어도 오래 담아두지 않고 먼저 풀어요.'),
        ('forgiveness', 1, '실수한 사람에게 괜찮다고 말해주는 여유가 있어요.'),
        ('humility', 0, '잘한 일도 함께한 사람들 덕분이라고 말하더라고요.'),
        ('humility', 1, '자기 자랑 없이 묵묵히 해내는 모습이 오래 남아요.'),
        ('prudence', 0, '급할수록 한 번 더 확인하는 덕분에 실수를 여러 번 막았어요.'),
        ('prudence', 1, '결정을 서두르지 않고 나중까지 생각해서 골라요.'),
        ('self_regulation', 0, '화가 날 만한 상황에서도 차분하게 말을 고르더라고요.'),
        ('self_regulation', 1, '정해둔 습관을 꾸준히 지키는 모습이 대단해 보여요.'),
        ('appreciation_of_beauty', 0, '평범한 풍경에서도 좋은 점을 찾아 이야기해줘요.'),
        ('appreciation_of_beauty', 1, '다른 사람의 좋은 작업을 알아보고 진심으로 감탄해줘요.'),
        ('gratitude', 0, '사소한 도움에도 꼭 고맙다고 표현해줘요.'),
        ('gratitude', 1, '지나고 나서도 그때 고마웠다고 다시 말해주는 사람이에요.'),
        ('hope', 0, '일이 꼬였을 때도 잘될 거라며 다음 방법을 같이 찾아줬어요.'),
        ('hope', 1, '앞으로에 대한 이야기를 할 때 눈이 반짝여요.'),
        ('humor', 0, '긴장된 자리에서 한마디로 모두를 웃게 만들었어요.'),
        ('humor', 1, '힘든 날에도 가볍게 웃을 거리를 만들어줘요.'),
        ('spirituality', 0, '하는 일의 의미를 자주 되새기고 나눠줘요.'),
        ('spirituality', 1, '바쁜 중에도 더 중요한 게 무엇인지 놓치지 않아요.')
      ) as m(code, k, reason)
      where m.code = r.codes[i]
        and m.k = (i + v_index) % 2;

      -- 남긴 시각을 지난 몇 시간 안에 흩어 둔다. 모두 '방금' 으로 보이면 예시 같지 않다
      insert into public.feedbacks (person_id, submission_key, created_at)
      values (
        v_person,
        gen_random_uuid(),
        now() - make_interval(mins => ((v_index * 37 + i * 23) % 240) + 5)
      )
      returning id into v_fb;

      insert into public.feedback_items (feedback_id, strength_code, reason)
      values (v_fb, r.codes[i], v_reason);

      v_count := v_count + 1;
    end loop;
  end loop;

  insert into public.admin_audit_log (admin_email, action, detail)
  values (v_admin, 'seed_demo', jsonb_build_object('count', v_index));

  return v_index;
end;
$$;

create or replace function public.clear_demo()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin   text := lower(auth.jwt() ->> 'email');
  v_removed int;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  delete from public.people where is_demo;
  get diagnostics v_removed = row_count;

  insert into public.admin_audit_log (admin_email, action, detail)
  values (v_admin, 'clear_demo', jsonb_build_object('count', v_removed));

  return v_removed;
end;
$$;

create or replace function public.set_app_mode(p_mode text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin text := lower(auth.jwt() ->> 'email');
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_mode is null or p_mode not in ('demo', 'live') then
    raise exception 'mode must be demo or live';
  end if;

  insert into public.app_state (id, mode, updated_by, updated_at)
  values (true, p_mode, v_admin, now())
  on conflict (id) do update
    set mode = excluded.mode,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at;

  insert into public.admin_audit_log (admin_email, action, detail)
  values (v_admin, 'set_mode', jsonb_build_object('mode', p_mode));

  return p_mode;
end;
$$;

revoke all on function public.seed_demo()          from public, anon, authenticated;
revoke all on function public.clear_demo()         from public, anon, authenticated;
revoke all on function public.set_app_mode(text)   from public, anon, authenticated;

grant execute on function public.seed_demo()        to authenticated;
grant execute on function public.clear_demo()       to authenticated;
grant execute on function public.set_app_mode(text) to authenticated;


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
  ('kindness',               '친절',     'Kindness',                           'humanity',       '대가 없이 돕고 보살펴요',                 10),
  ('love',                   '사랑',     'Love',                               'humanity',       '가까운 사람과 깊이 이어져요',          11),
  ('social_intelligence',    '사회지능', 'Social Intelligence',                'humanity',       '분위기와 마음을 잘 읽어요',            12),
  ('teamwork',               '협동심',   'Teamwork',                           'justice',        '팀의 한 사람으로 제 몫을 해요',                  13),
  ('fairness',               '공정성',   'Fairness',                           'justice',        '모두를 똑같이 대해요',                 14),
  ('leadership',             '리더십',   'Leadership',                         'justice',        '사람들을 모으고 이끌어요',             15),
  ('forgiveness',            '용서',     'Forgiveness',                        'temperance',     '잘못을 오래 담아두지 않아요',          16),
  ('humility',               '겸손',     'Humility',                           'temperance',     '굳이 드러내지 않아요',                 17),
  ('prudence',               '신중성',   'Prudence',                           'temperance',     '나중을 생각하고 선택해요',             18),
  ('self_regulation',        '자기통제력','Self-Regulation',                   'temperance',     '감정과 행동을 스스로 다스려요',        19),
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
--   select count(*) from public.strengths;  -- 24
--   select * from public.admin_allowlist;   -- 본인 이메일 1건
--
--   -- 비율이 전부 5의 배수이고 사람별 합이 정확히 100 인지
--   select person_id, sum(ratio) as total, bool_and(ratio % 5 = 0) as on_grid
--   from public.person_strength_ratio group by person_id;
--   -- 받은 강점이 아직 없으면 0행이 나온다. 정상이다
-- ============================================================
