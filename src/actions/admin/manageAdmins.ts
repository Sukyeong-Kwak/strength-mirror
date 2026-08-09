"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdmin, writeAuditLog } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

const AddAdminInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(254)),
  label: z.string().trim().max(20).nullable(),
});

const RemoveAdminInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export async function addAdmin(input: unknown): Promise<ActionResult<{ email: string }>> {
  const admin = await assertAdmin();

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
    added_by: admin.email,
  });

  if (error) {
    return { ok: false, error: "추가하지 못했어요. 다시 눌러주세요" };
  }

  await writeAuditLog(supabase, admin.email, "add_admin", { email });
  revalidatePath("/admin/settings");

  return { ok: true, data: { email } };
}

export async function removeAdmin(input: unknown): Promise<ActionResult> {
  const admin = await assertAdmin();

  const parsed = RemoveAdminInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "이메일 주소를 정확히 입력해주세요" };
  }

  const { email } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // 마지막 한 명은 제거할 수 없다. 아무도 못 들어가는 상태를 만들지 않기 위해서다
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

  const { error } = await supabase
    .from("admin_allowlist")
    .delete()
    .eq("email", email);

  if (error) {
    return { ok: false, error: "제거하지 못했어요. 다시 눌러주세요" };
  }

  await writeAuditLog(supabase, admin.email, "remove_admin", { email });
  revalidatePath("/admin/settings");

  return { ok: true, data: undefined };
}
