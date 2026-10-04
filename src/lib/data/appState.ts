/**
 * 지금 참여자 화면이 예시를 보여주는지, 실제 참여를 보여주는지.
 *
 * 로그인 없이 열리는 화면에서도 읽으므로 auth/dal.ts 를 거치지 않는다.
 * 바꾸는 것은 관리자 전용 RPC(set_app_mode)로만 한다.
 */

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppMode = "demo" | "live";

/**
 * 한 요청 안에서는 한 번만 읽는다. 레이아웃 · 페이지 · 명단 조회가 모두 묻는다.
 *
 * 읽지 못하면 live 로 본다. app_state 는 이번 스키마 변경으로 생겼다.
 * 스키마를 다시 실행하기 전에는 테이블이 없는데, 그때 화면 전체가 멈추면 안 된다.
 * live 는 이 기능이 생기기 전과 똑같이 보이는 값이다.
 */
export const getAppMode = cache(async (): Promise<AppMode> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_state" as never)
    .select("mode")
    .limit(1)
    .overrideTypes<Array<{ mode: string }>, { merge: false }>();

  if (error) {
    return "live";
  }
  return data?.[0]?.mode === "demo" ? "demo" : "live";
});

/** 이 사람이 지금 모드에 속하는지 */
export function inMode(isDemo: boolean, mode: AppMode): boolean {
  return isDemo === (mode === "demo");
}
