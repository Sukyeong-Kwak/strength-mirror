import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AdminAction } from "@/types/domain";

export type AdminSession = {
  email: string;
  label: string | null;
};

type Client = SupabaseClient<Database>;

/**
 * 로그인 세션과 허용목록을 **둘 다** 확인한다.
 * 로그인만으로는 관리자가 아니다.
 *
 * admin_allowlist 는 is_admin() 정책으로 보호돼 있어서,
 * 허용목록에 없는 계정이 조회하면 행이 하나도 오지 않는다.
 *
 * 화면과 조회에서는 이것을 직접 부르지 말고 lib/auth/dal 의 함수를 쓴다.
 * 확인과 조회가 떨어져 있으면 새 화면에서 확인을 빠뜨리게 된다.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (email === undefined || email === "") {
    return null;
  }

  const { data } = await supabase
    .from("admin_allowlist")
    .select("email, label")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (data === null) {
    return null;
  }

  return { email: data.email, label: data.label };
}

/** 표시용 이름. label 이 없으면 이메일을 쓴다 */
export function adminDisplayName(session: AdminSession): string {
  return session.label ?? session.email;
}

/**
 * 관리자가 여러 명이므로 누가 무엇을 했는지 남긴다.
 * 기록 실패가 본 작업을 되돌리지는 않는다.
 */
export async function writeAuditLog(
  supabase: Client,
  adminEmail: string,
  action: AdminAction,
  detail: Database["public"]["Tables"]["admin_audit_log"]["Insert"]["detail"] = null,
): Promise<void> {
  await supabase.from("admin_audit_log").insert({
    admin_email: adminEmail,
    action,
    detail,
  });
}
