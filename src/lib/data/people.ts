/**
 * 참여자 화면의 명단 조회.
 *
 * 관리자 조회는 `lib/auth/dal.ts` 를 거치지만 이쪽은 로그인 없이 열리는 화면이다.
 * 권한 확인을 붙이면 안 되므로 파일을 나눈다. 섞어두면 언젠가
 * 참여자 화면에 requireAdmin 이 딸려 들어간다.
 *
 * 내려주는 값은 RLS 가 anon 에게 허용한 범위 안이다.
 * created_by(등록한 관리자) 처럼 화면에 필요 없는 값은 애초에 고르지 않는다.
 */

import { getAppMode, inMode, type AppMode } from "@/lib/data/appState";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Person } from "@/types/domain";

type PeopleRow = {
  id: string;
  name: string;
  group_name: string | null;
  hidden_at: string | null;
  /** 이번 스키마 변경으로 생긴 칸. 재실행 전 DB 에는 없다 */
  is_demo?: boolean;
  created_at: string;
};

function toPerson(row: PeopleRow): Person {
  return {
    id: row.id,
    name: row.name,
    groupName: row.group_name,
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, name, group_name, hidden_at, is_demo, created_at";
/** is_demo 가 없는 옛 DB 용. 컬럼 단위 권한이라 없는 칸을 고르면 select 전체가 거절된다 */
const LEGACY_COLUMNS = "id, name, group_name, hidden_at, created_at";

/**
 * people 을 읽는다. personId 를 주면 그 한 사람만.
 *
 * 생성 타입이 hidden_at · is_demo 를 아직 몰라 결과 타입을 직접 지정한다.
 * is_demo 로 고르다 실패하면 옛 칸들로 한 번 더 읽는다. 스키마를 다시 실행하기 전에
 * 새 코드가 먼저 배포돼도 홈이 멈추지 않게 하려는 것이다. 그때는 모두 실제 인물로 본다.
 */
export async function readPeopleRows(personId?: string): Promise<PeopleRow[]> {
  const supabase = await createSupabaseServerClient();

  const run = (columns: string) => {
    const query = supabase.from("people").select(columns);
    const scoped = personId === undefined ? query : query.eq("id", personId).limit(1);
    return scoped
      .order("group_name", { ascending: true })
      .order("name", { ascending: true })
      .overrideTypes<PeopleRow[], { merge: false }>();
  };

  const first = await run(COLUMNS);
  if (!first.error) {
    return first.data ?? [];
  }
  const legacy = await run(LEGACY_COLUMNS);
  // 빈 배열로 넘기면 "아직 명단이 없어요" 라는 정반대 화면이 된다.
  // 조회 실패는 삼키지 않고 에러 바운더리로 보낸다
  if (legacy.error) {
    throw new Error("명단을 불러오지 못했어요");
  }
  return legacy.data ?? [];
}

/** 참여자 화면에 나올 사람인지 — 숨기지 않았고 지금 모드에 속한다 */
function isVisible(row: PeopleRow, mode: AppMode): boolean {
  return row.hidden_at === null && inMode(row.is_demo ?? false, mode);
}

/**
 * 지금 참여자 화면에 나올 사람 전체.
 *
 * 예시 모드면 예시 인물만, 실제 모드면 실제 인물만. 숨긴 사람은 뺀다.
 * 거르기를 쿼리가 아니라 여기서 하는 것은 옛 DB 에 is_demo 가 없을 수 있어서다.
 * 명단은 많아야 수백 명이라 실무상 차이가 없다.
 */
export async function listPeople(): Promise<Person[]> {
  const [rows, mode] = await Promise.all([readPeopleRows(), getAppMode()]);
  return rows.filter((row) => isVisible(row, mode)).map(toPerson);
}

/** 한 사람. 없거나, 숨겼거나, 지금 모드가 아니면 null */
export async function getPerson(personId: string): Promise<Person | null> {
  const [rows, mode] = await Promise.all([readPeopleRows(personId), getAppMode()]);
  const row = rows[0];
  if (row === undefined || !isVisible(row, mode)) {
    return null;
  }
  return toPerson(row);
}
