"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/**
 * 예시 화면 ↔ 실제 참여 화면.
 *
 * 실제 일은 DB 의 관리자 전용 함수(seed_demo · clear_demo · set_app_mode)가 한다.
 * 예시 제출을 만들려면 feedbacks 에 직접 넣어야 하는데 그 권한은 소유자에게만 있다.
 * 활동 기록도 함수 안에서 남긴다.
 *
 * 생성 타입은 이 함수들을 아직 모른다. 스키마 재실행 + npm run gen:types 뒤에
 * 캐스팅을 지운다.
 */

type Rpc = (
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;

async function rpcAsAdmin(
  fn: string,
  args?: Record<string, unknown>,
): Promise<ActionResult<unknown>> {
  const admin = await getAdminSession();
  if (admin === null) {
    return { ok: false, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }

  const supabase = await createSupabaseServerClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as Rpc;
  const { data, error } = await rpc(fn, args);

  if (error) {
    // 함수가 없다 — 스키마를 다시 실행하지 않았다
    if (error.code === "PGRST202" || error.code === "42883") {
      return {
        ok: false,
        error: "DB 에 이 기능이 아직 없어요. supabase/schema.sql 을 다시 실행해주세요",
      };
    }
    return { ok: false, error: "처리하지 못했어요. 다시 눌러주세요" };
  }

  // 참여자 화면 전체가 바뀐다. 명단 · 결과 · 집계 어디에서든 새로 그려야 한다
  revalidatePath("/", "layout");
  return { ok: true, data };
}

/** 예시를 (다시) 채운다. 있던 예시와 그 위에 남긴 연습 기록은 지워진다 */
export async function seedDemo(): Promise<ActionResult<{ count: number }>> {
  const result = await rpcAsAdmin("seed_demo");
  if (!result.ok) {
    return result;
  }
  return { ok: true, data: { count: typeof result.data === "number" ? result.data : 0 } };
}

/** 예시를 모두 지운다 */
export async function clearDemo(): Promise<ActionResult<{ count: number }>> {
  const result = await rpcAsAdmin("clear_demo");
  if (!result.ok) {
    return result;
  }
  return { ok: true, data: { count: typeof result.data === "number" ? result.data : 0 } };
}

const ModeInput = z.enum(["demo", "live"]);

/** 참여자 화면을 예시 또는 실제 참여로 바꾼다 */
export async function setAppMode(input: unknown): Promise<ActionResult> {
  const parsed = ModeInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "바꿀 화면을 알 수 없어요. 새로고침해주세요" };
  }
  const result = await rpcAsAdmin("set_app_mode", { p_mode: parsed.data });
  return result.ok ? { ok: true, data: undefined } : result;
}
