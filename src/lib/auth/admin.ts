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

/**
 * 관리자 Server Action 의 첫 줄에서 호출한다.
 * 미들웨어는 Server Action 을 우회할 수 있으므로 여기서 한 번 더 막는다.
 * 최종 방어선은 RLS 지만, 앱에서도 막아야 명확한 메시지를 줄 수 있다.
 */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session === null) {
    throw new Error("관리자만 쓸 수 있어요");
  }
  return session;
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
