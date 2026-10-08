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

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Person } from "@/types/domain";

export type PeopleRow = {
  id: string;
  event_id: string;
  name: string;
  group_name: string | null;
  hidden_at: string | null;
  created_at: string;
};

function toPerson(row: PeopleRow): Person {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    groupName: row.group_name,
    createdAt: row.created_at,
  };
}

const COLUMNS = "id, event_id, name, group_name, hidden_at, created_at";

/**
 * 한 그룹의 people 을 숨긴 사람까지 읽는다.
 *
 * 명단 등록 · 고치기가 중복을 볼 때도 쓴다. 숨긴 사람과 이름이 겹쳐도 중복이다.
 */
export async function readPeopleRows(eventId: string): Promise<PeopleRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select(COLUMNS)
    .eq("event_id", eventId)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });

  // 빈 배열로 넘기면 "아직 명단이 없어요" 라는 정반대 화면이 된다.
  // 조회 실패는 삼키지 않고 에러 바운더리로 보낸다
  if (error) {
    throw new Error("명단을 불러오지 못했어요");
  }
  return data ?? [];
}

/** 한 그룹의 참여자 화면에 나올 사람 전체. 숨긴 사람은 뺀다 */
export async function listPeople(eventId: string): Promise<Person[]> {
  const rows = await readPeopleRows(eventId);
  return rows.filter((row) => row.hidden_at === null).map(toPerson);
}

/**
 * 한 사람. 없거나 숨겼으면 null.
 *
 * 개인 화면은 레이아웃(예시 안내)과 페이지가 모두 묻는다. cache() 로 한 번만 읽는다.
 */
export const getPerson = cache(async (personId: string): Promise<Person | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select(COLUMNS)
    .eq("id", personId)
    .maybeSingle();

  if (error) {
    throw new Error("명단을 불러오지 못했어요");
  }
  if (data === null || data.hidden_at !== null) {
    return null;
  }
  return toPerson(data);
});
