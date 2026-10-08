-- ============================================================
-- 그룹 명단 채우기 — 청년부 리더 MT · 원띵 오이코스
--
-- Supabase → SQL Editor 에 붙여넣고 실행한다.
-- schema.sql 을 먼저 실행해 둔 DB 여야 한다 (events 표가 있어야 한다).
--
-- 없는 사람만 넣는다. 지우는 것은 없으므로 여러 번 실행해도 같은 상태가 된다.
-- 같은 그룹 · 같은 조 · 같은 이름이면 이미 있는 것으로 본다.
-- ============================================================

-- 예전에 '둘째 날 합류' 로 넣은 3명은 주황팀으로 옮긴다.
-- 아래 insert 보다 먼저 해야 한다 — 그러지 않으면 조 이름이 달라서
-- 같은 사람이 주황팀으로 한 번 더 들어간다.
update public.people p
set group_name = '주황팀'
from public.events e
where e.id = p.event_id
  and e.slug = 'leader-mt'
  and p.group_name = '둘째 날 합류';

insert into public.people (event_id, name, group_name, created_by)
select e.id, t.name, t.grp, 'sky339128@gmail.com'
from (values
  -- 청년부 리더 MT (월악드림펜션)
  ('leader-mt', '서지수', '파란팀'), ('leader-mt', '한동규', '파란팀'), ('leader-mt', '곽수경', '파란팀'),
  ('leader-mt', '배성은', '파란팀'), ('leader-mt', '김미소', '파란팀'),
  ('leader-mt', '강성언', '검은팀'), ('leader-mt', '신선한', '검은팀'), ('leader-mt', '박서인', '검은팀'),
  ('leader-mt', '명찬욱', '검은팀'), ('leader-mt', '정사랑', '검은팀'),
  ('leader-mt', '김수나', '투명팀'), ('leader-mt', '김지유', '투명팀'), ('leader-mt', '장수진', '투명팀'),
  ('leader-mt', '최태옥', '투명팀'), ('leader-mt', '김정미', '투명팀'), ('leader-mt', '이규범', '투명팀'),
  ('leader-mt', '이세빈', '보라팀'), ('leader-mt', '최희',   '보라팀'), ('leader-mt', '황소망', '보라팀'),
  ('leader-mt', '김문기', '보라팀'), ('leader-mt', '이기쁨', '보라팀'),
  ('leader-mt', '황수민', '갈색팀'), ('leader-mt', '박윤선', '갈색팀'), ('leader-mt', '강보경', '갈색팀'),
  ('leader-mt', '이지안', '갈색팀'), ('leader-mt', '이연수', '갈색팀'),
  ('leader-mt', '김민성', '초록팀'), ('leader-mt', '이윤석', '초록팀'), ('leader-mt', '김혜인', '초록팀'),
  ('leader-mt', '정보라', '초록팀'), ('leader-mt', '오예본', '초록팀'),
  ('leader-mt', '강희',   '주황팀'), ('leader-mt', '박대명', '주황팀'),
  ('leader-mt', '최연선', '주황팀'),
  ('leader-mt', '김준형 목사님', '특별 참석'),

  -- 원띵 오이코스
  ('oikos', '곽수경', '원띵'), ('oikos', '김수나', '원띵'), ('oikos', '노은주', '원띵'),
  ('oikos', '신선한', '원띵'), ('oikos', '정승민', '원띵'), ('oikos', '조용운', '원띵'),
  ('oikos', '최유라', '원띵')
) as t(slug, name, grp)
join public.events e on e.slug = t.slug
where not exists (
  select 1 from public.people p
  where p.event_id = e.id
    and p.name = t.name
    and p.group_name is not distinct from t.grp
);


-- ------------------------------------------------------------
-- 실행 후 확인 (선택)
--
--   select e.title, p.group_name, count(*)
--   from public.people p join public.events e on e.id = p.event_id
--   group by e.title, p.group_name order by e.title, p.group_name;
--   -- 청년부 리더 MT 35명 · 원띵 오이코스 7명
-- ------------------------------------------------------------
