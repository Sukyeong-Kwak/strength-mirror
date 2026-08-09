-- ============================================================
-- VIA 강점 피드백 앱 — 전체 스키마
--
-- 실행 방법
--   Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여넣고 Run
--   여러 번 실행해도 같은 상태가 되도록 작성했다 (drop/if not exists)
--
-- 실행 전에 아래 두 가지를 반드시 처리할 것
--   1) 이 파일 맨 아래 admin_allowlist seed 에 본인 이메일을 넣는다
--   2) 아래 device pepper 를 .env.local 의 DEVICE_ID_PEPPER 와 같은 값으로 맞춘다
-- ============================================================


-- ------------------------------------------------------------
-- 1. 확장
-- ------------------------------------------------------------

-- extensions 스키마에 설치한다. public 에 들어가면 pgcrypto 의 모든 함수가
-- PUBLIC 실행 권한을 달고 anon 이 호출 가능한 RPC 로 노출된다
create extension if not exists pgcrypto with schema extensions;


-- ------------------------------------------------------------
-- 2. 테이블
-- ------------------------------------------------------------

-- 서버 전용 설정값 보관소.
--
-- Supabase 의 postgres 롤은 슈퍼유저가 아니라서
-- `alter database ... set app.device_pepper` 로 커스텀 GUC 를 만들 수 없다.
-- 그래서 pepper 를 이 테이블에 두고 security definer 함수로만 꺼내 쓴다.
--
-- 이 테이블은 RLS 를 켜고 정책을 하나도 만들지 않으며, 어떤 역할에도
-- 권한을 주지 않는다. 즉 API 로는 어떤 경로로도 읽을 수 없다.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

-- 피드백을 받는 대상자. 동명이인을 허용하므로 unique 제약을 두지 않는다
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  group_name  text null check (group_name is null or char_length(btrim(group_name)) between 1 and 40),
  created_by  text null,
  created_at  timestamptz not null default now()
);

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
  -- 기기 식별 해시. 참고용 신호일 뿐 차단·집계에 쓰지 않는다 (5-11)
  client_hash    text not null,
  -- 멱등 키. 같은 키로 두 번 오면 두 번째는 무시된다
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

-- 관리자가 여러 명이므로 누가 무엇을 했는지 남긴다. client_hash 는 절대 넣지 말 것
create table if not exists public.admin_audit_log (
  id          bigserial primary key,
  admin_email text not null,
  action      text not null check (
                action in ('login','import_people','exclude_feedback','restore_feedback','add_admin','remove_admin')
              ),
  detail      jsonb null,
  created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2-1. device pepper
--
-- 아래 자리표시자를 .env.local 의 DEVICE_ID_PEPPER 와 같은 값으로 바꾼 뒤 실행한다.
-- 값이 다르면 "이전에 남김" 표시와 진행률이 동작하지 않는다.
--
-- 이 파일은 저장소에 커밋되므로 실제 pepper 를 여기에 적어두지 말 것.
--
-- 한번 정하면 바꾸지 말 것. 값을 바꾸면 이미 쌓인 client_hash 와
-- 매칭되지 않아 기존 제출 이력이 전부 다른 기기로 인식된다.
-- 그래서 이미 값이 있으면 덮어쓰지 않는다 (재실행해도 안전하도록).
-- ------------------------------------------------------------

insert into public.app_config (key, value) values
  ('device_pepper', 'PASTE_DEVICE_ID_PEPPER_HERE')
on conflict (key) do nothing;


-- ------------------------------------------------------------
-- 3. 인덱스
-- ------------------------------------------------------------

create index if not exists people_group_name_idx
  on public.people (group_name);

create index if not exists feedbacks_client_hash_person_idx
  on public.feedbacks (client_hash, person_id);

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


-- pepper 접근자. 어떤 역할에도 실행 권한을 주지 않으므로
-- 소유자(postgres)로 실행되는 다른 security definer 함수 안에서만 호출된다
create or replace function public.device_pepper()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select value from public.app_config where key = 'device_pepper';
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
where f.excluded_at is null;

-- (관리자 전용) 수신 현황. 관리자는 누가 몇 개를 받았는지 모두 볼 수 있다
create view public.person_totals_internal as
select t.*
from (
  select
    p.id                                   as person_id,
    p.name,
    coalesce(p.group_name, '미지정')       as group_name,
    p.created_by,
    count(distinct f.id)::int              as submission_count,
    count(i.id)::int                       as strength_count
  from public.people p
  left join public.feedbacks f
    on f.person_id = p.id and f.excluded_at is null
  left join public.feedback_items i
    on i.feedback_id = f.id
  group by p.id, p.name, p.group_name, p.created_by
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
  group by coalesce(p.group_name, '미지정')
) t
where public.assert_admin();

-- anon 이 읽는 유일한 상태 뷰. 컬럼은 두 개뿐이다
create view public.results_status as
select
  public.results_unlocked() as unlocked,
  public.results_remaining() as remaining;

-- 개인 · 강점별 비율
create view public.person_strength_ratio as
with base as (
  select person_id, strength_code from public.feedback_items_active
),
tot as (
  select person_id, count(*)::numeric as total from base group by person_id
)
select
  b.person_id,
  b.strength_code,
  s.name_ko,
  s.virtue,
  round(100.0 * count(*) / t.total)::int as ratio
from base b
join tot t         on t.person_id = b.person_id
join public.strengths s on s.code = b.strength_code
where public.results_unlocked()
group by b.person_id, b.strength_code, s.name_ko, s.virtue, t.total;

-- 개인 · 덕목별 비율. 최대잔여법으로 합계를 정확히 100 으로 맞춘다
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
    floor(100.0 * c.c / t.total)::int         as base_ratio,
    100.0 * c.c / t.total - floor(100.0 * c.c / t.total) as rem
  from cnt c join tot t on t.person_id = c.person_id
),
ranked as (
  select
    person_id,
    virtue,
    base_ratio,
    row_number() over (partition by person_id order by rem desc, virtue) as rn,
    100 - sum(base_ratio) over (partition by person_id)                  as leftover
  from frac
)
select
  person_id,
  virtue,
  base_ratio + case when rn <= leftover then 1 else 0 end as ratio
from ranked
where public.results_unlocked();

-- 전체 · 강점별 비율
create view public.overall_strength_ratio as
with base as (
  select strength_code from public.feedback_items_active
),
tot as (
  select count(*)::numeric as total from base
)
select
  b.strength_code,
  s.name_ko,
  s.virtue,
  round(100.0 * count(*) / t.total)::int as ratio
from base b
cross join tot t
join public.strengths s on s.code = b.strength_code
where public.results_unlocked()
group by b.strength_code, s.name_ko, s.virtue, t.total;

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
    floor(100.0 * c.c / t.total)::int         as base_ratio,
    100.0 * c.c / t.total - floor(100.0 * c.c / t.total) as rem
  from cnt c cross join tot t
),
ranked as (
  select
    virtue,
    base_ratio,
    row_number() over (order by rem desc, virtue) as rn,
    100 - sum(base_ratio) over ()                as leftover
  from frac
)
select
  virtue,
  base_ratio + case when rn <= leftover then 1 else 0 end as ratio
from ranked
where public.results_unlocked();

-- 조 · 강점별 비율
create view public.group_strength_ratio as
with base as (
  select group_name, strength_code from public.feedback_items_active
),
tot as (
  select group_name, count(*)::numeric as total from base group by group_name
)
select
  b.group_name,
  b.strength_code,
  s.name_ko,
  s.virtue,
  round(100.0 * count(*) / t.total)::int as ratio
from base b
join tot t              on t.group_name = b.group_name
join public.strengths s on s.code = b.strength_code
where public.results_unlocked()
group by b.group_name, b.strength_code, s.name_ko, s.virtue, t.total;

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
    floor(100.0 * c.c / t.total)::int         as base_ratio,
    100.0 * c.c / t.total - floor(100.0 * c.c / t.total) as rem
  from cnt c join tot t on t.group_name = c.group_name
),
ranked as (
  select
    group_name,
    virtue,
    base_ratio,
    row_number() over (partition by group_name order by rem desc, virtue) as rn,
    100 - sum(base_ratio) over (partition by group_name)                  as leftover
  from frac
)
select
  group_name,
  virtue,
  base_ratio + case when rn <= leftover then 1 else 0 end as ratio
from ranked
where public.results_unlocked();

-- 사유 목록. client_hash 를 포함하지 않는다.
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
grant select (id, name, group_name, created_at) on public.people to anon, authenticated;
grant insert                                    on public.people to authenticated;

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

-- app_config 는 어떤 역할에도 주지 않는다 (pepper 보관소)

-- 함수 실행 권한
revoke all on function public.is_admin()          from public, anon, authenticated;
revoke all on function public.assert_admin()      from public, anon, authenticated;
revoke all on function public.device_pepper()     from public, anon, authenticated;
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

-- app_config 는 정책을 하나도 만들지 않는다. RLS 만 켜두면 아무도 읽을 수 없다
alter table public.app_config      enable row level security;
alter table public.people          enable row level security;
alter table public.strengths       enable row level security;
alter table public.feedbacks       enable row level security;
alter table public.feedback_items  enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists people_select_all        on public.people;
drop policy if exists people_insert_admin      on public.people;
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
-- 9. RPC
-- ------------------------------------------------------------

-- 제출. feedbacks 1건 + feedback_items N건을 한 트랜잭션에 넣고 id 를 돌려준다.
-- 같은 submission_key 가 다시 오면 새로 넣지 않고 기존 id 를 그대로 반환한다
create or replace function public.submit_feedback(
  p_person_id      uuid,
  p_author_name    text,
  p_client_id      text,
  p_submission_key uuid,
  p_items          jsonb
)
returns uuid
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  v_pepper      text;
  v_hash        text;
  v_count       int;
  v_feedback_id uuid;
begin
  if p_person_id is null or p_submission_key is null then
    raise exception 'person_id and submission_key are required';
  end if;

  if p_client_id is null or btrim(p_client_id) = '' then
    raise exception 'client_id is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'items must be a json array';
  end if;

  select count(*)::int into v_count from jsonb_array_elements(p_items);
  if v_count < 1 or v_count > 5 then
    raise exception 'items count must be between 1 and 5';
  end if;

  -- 멱등 처리를 먼저 한다. 이미 있으면 pepper 조회 없이 그대로 돌려준다
  select id into v_feedback_id
  from public.feedbacks
  where submission_key = p_submission_key;

  if v_feedback_id is not null then
    return v_feedback_id;
  end if;

  v_pepper := public.device_pepper();
  if v_pepper is null or btrim(v_pepper) = '' then
    raise exception 'device_pepper is not configured';
  end if;

  -- 원본 client_id 는 어디에도 저장하지 않는다
  v_hash := encode(hmac(p_client_id, v_pepper, 'sha256'), 'hex');

  insert into public.feedbacks (person_id, author_name, client_hash, submission_key)
  values (
    p_person_id,
    nullif(btrim(coalesce(p_author_name, '')), ''),
    v_hash,
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

-- 이 기기의 제출 내역만 반환한다.
-- 해시 원본을 모르면 다른 기기의 데이터는 어떤 인자로도 조회할 수 없다
create or replace function public.get_my_submissions(p_client_id text)
returns table (person_id uuid, strength_code text, created_at timestamptz)
language plpgsql
security definer
set search_path = extensions, public
as $$
declare
  v_pepper text;
  v_hash   text;
begin
  if p_client_id is null or btrim(p_client_id) = '' then
    return;
  end if;

  v_pepper := public.device_pepper();
  if v_pepper is null or btrim(v_pepper) = '' then
    raise exception 'device_pepper is not configured';
  end if;

  v_hash := encode(hmac(p_client_id, v_pepper, 'sha256'), 'hex');

  return query
  select f.person_id, i.strength_code, f.created_at
  from public.feedbacks f
  join public.feedback_items i on i.feedback_id = f.id
  where f.client_hash = v_hash
    and f.excluded_at is null;
end;
$$;

revoke all on function public.submit_feedback(uuid, text, text, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.get_my_submissions(text)
  from public, anon, authenticated;

grant execute on function public.submit_feedback(uuid, text, text, uuid, jsonb)
  to anon, authenticated;
grant execute on function public.get_my_submissions(text)
  to anon, authenticated;


-- ------------------------------------------------------------
-- 10. seed — VIA 24 강점
--
-- 화면에 쓰이는 문구의 원본은 src/lib/strengths.ts 다.
-- 여기 description 은 참고용이므로 문구를 고쳐도 마이그레이션이 필요 없다.
-- ------------------------------------------------------------

insert into public.strengths (code, name_ko, name_en, virtue, description, sort_order) values
  ('creativity',             '창의성',   'Creativity',                         'wisdom',         '새롭고 더 나은 방법을 떠올려요',        1),
  ('curiosity',              '호기심',   'Curiosity',                          'wisdom',         '모르는 걸 그냥 지나치지 않아요',        2),
  ('judgment',               '판단력',   'Judgment',                           'wisdom',         '성급하게 결론 내지 않아요',            3),
  ('love_of_learning',       '학구열',   'Love of Learning',                   'wisdom',         '배우는 것 자체를 즐겨요',              4),
  ('perspective',            '통찰력',   'Perspective',                        'wisdom',         '큰 그림으로 조언해줘요',               5),
  ('bravery',                '용감함',   'Bravery',                            'courage',        '두려워도 옳은 일을 해요',              6),
  ('perseverance',           '끈기',     'Perseverance',                       'courage',        '시작한 일을 끝까지 해내요',            7),
  ('honesty',                '정직',     'Honesty',                            'courage',        '꾸미지 않고 진실하게 말해요',          8),
  ('zest',                   '활력',     'Zest',                               'courage',        '에너지가 있고 함께 있으면 신나요',      9),
  ('love',                   '사랑',     'Love',                               'humanity',       '가까운 사람과 깊이 이어져요',          10),
  ('kindness',               '친절',     'Kindness',                           'humanity',       '먼저 챙기고 베풀어요',                 11),
  ('social_intelligence',    '사회지능', 'Social Intelligence',                'humanity',       '분위기와 마음을 잘 읽어요',            12),
  ('teamwork',               '협동심',   'Teamwork',                           'justice',        '함께할 때 더 잘해요',                  13),
  ('fairness',               '공정성',   'Fairness',                           'justice',        '모두를 똑같이 대해요',                 14),
  ('leadership',             '리더십',   'Leadership',                         'justice',        '사람들을 모으고 이끌어요',             15),
  ('forgiveness',            '용서',     'Forgiveness',                        'temperance',     '잘못을 오래 담아두지 않아요',          16),
  ('humility',               '겸손',     'Humility',                           'temperance',     '굳이 드러내지 않아요',                 17),
  ('prudence',               '신중함',   'Prudence',                           'temperance',     '나중을 생각하고 선택해요',             18),
  ('self_regulation',        '자기조절', 'Self-Regulation',                    'temperance',     '감정과 습관을 스스로 다스려요',        19),
  ('appreciation_of_beauty', '감상력',   'Appreciation of Beauty & Excellence', 'transcendence', '좋은 것을 알아보고 감탄해요',          20),
  ('gratitude',              '감사',     'Gratitude',                          'transcendence',  '고마움을 알고 표현해요',               21),
  ('hope',                   '희망',     'Hope',                               'transcendence',  '잘될 거라 믿고 나아가요',              22),
  ('humor',                  '유머',     'Humor',                              'transcendence',  '웃음을 만들어줘요',                    23),
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
--   select public.device_pepper();          -- pepper 값이 보여야 한다
--   select * from public.admin_allowlist;   -- 본인 이메일 1건
-- ============================================================
