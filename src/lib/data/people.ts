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

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Person } from "@/types/domain";

/**
 * hidden_at 은 스키마 재실행으로 생긴 컬럼이다.
 * `npm run gen:types` 를 돌리기 전까지 생성 타입이 이 컬럼을 모르므로
 * dal.ts 와 같은 방식으로 결과 타입을 직접 지정한다.
 */
type PeopleRow = {
  id: string;
  name: string;
  group_name: string | null;
  hidden_at: string | null;
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

/**
 * 숨기지 않은 사람 전체.
 *
 * 숨김 거르기를 DB 가 아니라 여기서 하는 이유는 생성 타입이 아직
 * hidden_at 을 몰라 `.is("hidden_at", null)` 이 컴파일되지 않기 때문이다.
 * 명단은 많아야 수백 명이라 실무상 차이가 없다.
 * 타입을 다시 뽑으면 필터를 쿼리로 옮겨도 된다.
 */
export async function listPeople(): Promise<Person[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("people")
    .select("id, name, group_name, hidden_at, created_at")
    .order("group_name", { ascending: true })
    .order("name", { ascending: true })
    .overrideTypes<PeopleRow[], { merge: false }>();

  // 빈 배열로 넘기면 "아직 명단이 없어요" 라는 정반대 화면이 된다.
  // 조회 실패는 삼키지 않고 에러 바운더리로 보낸다
  if (error) {
    throw new Error("명단을 불러오지 못했어요");
  }

  return (data ?? []).filter((row) => row.hidden_at === null).map(toPerson);
}

/** 한 사람. 없거나 숨긴 사람이면 null */
export async function getPerson(personId: string): Promise<Person | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("people")
    .select("id, name, group_name, hidden_at, created_at")
    .eq("id", personId)
    .limit(1)
    .overrideTypes<PeopleRow[], { merge: false }>();

  if (error) {
    throw new Error("사람을 불러오지 못했어요");
  }

  const row = (data ?? [])[0];
  if (row === undefined || row.hidden_at !== null) {
    return null;
  }
  return toPerson(row);
}
