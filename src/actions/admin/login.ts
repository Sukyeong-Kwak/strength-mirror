"use server";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/**
 * 로그인 직후 허용목록을 확인하고 기록을 남긴다.
 *
 * 로그인은 "이 사람이 이 이메일의 주인이다"까지만 보장한다.
 * 관리자인지는 여기서 따로 확인하고, 아니면 호출한 쪽에서 즉시 로그아웃한다.
 * 어떤 이메일이 허용목록에 있는지는 알려주지 않는다.
 */
export async function completeAdminLogin(): Promise<ActionResult<{ name: string }>> {
  const session = await getAdminSession();

  if (session === null) {
    return { ok: false, error: "접근 권한이 없는 계정이에요" };
  }

  const supabase = await createSupabaseServerClient();
  await writeAuditLog(supabase, session.email, "login");

  return { ok: true, data: { name: session.label ?? session.email } };
}
