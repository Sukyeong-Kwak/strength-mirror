/**
 * 그룹(행사 · 회사) 조회.
 *
 * 참여자 화면은 주소(/e/<slug>)로, 개인 화면은 그 사람의 소속으로 그룹을 찾는다.
 * 로그인 없이 열리는 화면에서도 읽으므로 auth/dal.ts 를 거치지 않는다.
 * 만들기와 고치기는 관리자 전용 Server Action(actions/admin/manageEvents)으로만 한다.
 */

import { cache } from "react";

import { isValidSlug } from "@/lib/eventSlug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventInfo } from "@/types/domain";

/** created_by(관리자 이메일)는 anon 에게 열려 있지 않다. 고르지 않는다 */
const COLUMNS = "id, slug, title, intro, is_sample, created_at";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  is_sample: boolean;
  created_at: string;
};

function toEvent(row: EventRow): EventInfo {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    intro: row.intro,
    isSample: row.is_sample,
  };
}

/**
 * 주소로 그룹을 찾는다. 없으면 null.
 *
 * 한 요청 안에서 레이아웃 · 페이지 · 메타데이터가 모두 묻는다. cache() 로 한 번만 읽는다.
 * 모양이 틀린 주소는 DB 에 묻지 않는다.
 */
export const getEventBySlug = cache(async (slug: string): Promise<EventInfo | null> => {
  if (!isValidSlug(slug)) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  // 없는 그룹과 조회 실패를 같은 화면(404)으로 보내면, 잠깐의 통신 오류에
  // "없는 주소예요" 라는 틀린 말을 하게 된다. 실패는 에러 바운더리로 보낸다
  if (error) {
    throw new Error("그룹을 불러오지 못했어요");
  }
  return data === null ? null : toEvent(data);
});

/** id 로 그룹을 찾는다. 개인 화면이 그 사람의 소속 그룹을 알아낼 때 쓴다 */
export const getEventById = cache(async (eventId: string): Promise<EventInfo | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(COLUMNS)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error("그룹을 불러오지 못했어요");
  }
  return data === null ? null : toEvent(data);
});

/**
 * 모든 그룹. 관리자 홈이 쓴다. 예시 그룹은 맨 뒤, 나머지는 만든 차례대로.
 *
 * 참여자 화면에는 그룹 목록을 보여주지 않는다. 다른 회사 이름이 서로 보이지 않게 하려는 것이다.
 */
export async function listEvents(): Promise<EventInfo[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(COLUMNS)
    .order("is_sample", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("그룹 목록을 불러오지 못했어요");
  }
  return (data ?? []).map(toEvent);
}
