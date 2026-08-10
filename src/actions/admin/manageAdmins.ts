"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession, writeAuditLog, type AdminSession } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

const AddAdminInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(254)),
  label: z.string().trim().max(20).nullable(),
});

const RemoveAdminInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

/**
 * 권한을 확인하되 던지지 않는다.
 *
 * Server Action 이 던지면 화면 전체가 에러 페이지로 바뀐다.
 * 관리자에서 빠진 뒤 열어둔 탭에서 버튼을 누른 경우라면
 * 화면은 그대로 두고 문구로 알려주는 편이 낫다.
 */
async function adminOrError(): Promise<
  { ok: true; admin: AdminSession } | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (session === null) {
    return { ok: false, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }
  return { ok: true, admin: session };
}

export async function addAdmin(input: unknown): Promise<ActionResult<{ email: string }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = AddAdminInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "이메일 주소를 정확히 입력해주세요" };
  }

  const { email, label } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (existing !== null) {
    return { ok: false, error: "이미 등록된 관리자예요" };
  }

  const { error } = await supabase.from("admin_allowlist").insert({
    email,
    label: label === "" ? null : label,
    added_by: auth.admin.email,
  });

  if (error) {
    return { ok: false, error: "추가하지 못했어요. 다시 눌러주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "add_admin", { email });
  revalidatePath("/admin/settings");

  return { ok: true, data: { email } };
}

export async function removeAdmin(input: unknown): Promise<ActionResult> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = RemoveAdminInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "이메일 주소를 정확히 입력해주세요" };
  }

  const { email } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // 마지막 한 명은 제거할 수 없다. 아무도 못 들어가는 상태를 만들지 않기 위해서다.
  // DB 쪽에도 같은 규칙의 트리거가 있고, 이 확인은 문구를 위한 것이다
  const { data: all, error: listError } = await supabase
    .from("admin_allowlist")
    .select("email");

  if (listError || all === null) {
    return { ok: false, error: "목록을 확인하지 못했어요. 다시 눌러주세요" };
  }

  if (all.length <= 1) {
    return { ok: false, error: "마지막 관리자는 제거할 수 없어요" };
  }

  if (!all.some((row) => row.email === email)) {
    return { ok: false, error: "이미 제거된 관리자예요" };
  }

  // select() 로 실제 지워진 행을 돌려받는다.
  // RLS 가 막으면 오류 없이 0행이 지워지므로, 오류만 봐서는 성공과 구분되지 않는다
  const { data: removed, error } = await supabase
    .from("admin_allowlist")
    .delete()
    .eq("email", email)
    .select("email");

  if (error) {
    return { ok: false, error: "제거하지 못했어요. 다시 눌러주세요" };
  }

  if (removed === null || removed.length === 0) {
    return { ok: false, error: "제거하지 못했어요. 목록을 새로고침해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "remove_admin", { email });
  revalidatePath("/admin/settings");

  return { ok: true, data: undefined };
}
