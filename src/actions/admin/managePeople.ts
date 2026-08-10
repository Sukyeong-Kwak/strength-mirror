"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

const SetHiddenInput = z.object({
  personId: z.uuid(),
  hidden: z.boolean(),
});

/** 삭제는 되돌릴 수 없으므로 화면이 이름을 그대로 다시 보내게 한다 */
const DeleteInput = z.object({
  personId: z.uuid(),
  /** 화면에 보이던 이름. 목록이 낡았는지 확인하는 용도 */
  expectedName: z.string().trim().min(1).max(40),
});

async function adminOrError() {
  const session = await getAdminSession();
  if (session === null) {
    return { ok: false as const, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }
  return { ok: true as const, admin: session };
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/people");
  revalidatePath("/");
}

/**
 * 숨기기 · 되돌리기.
 *
 * 숨기면 목록과 집계에서 빠지고 결과 공개 게이트에서도 빠진다.
 * 받은 글은 그대로 남으므로 언제든 되돌릴 수 있다.
 * 잘못 등록했거나 모임에 못 오게 된 사람에게 쓴다.
 */
export async function setPersonHidden(input: unknown): Promise<ActionResult> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = SetHiddenInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "대상을 찾지 못했어요. 새로고침해주세요" };
  }

  const { personId, hidden } = parsed.data;
  const supabase = await createSupabaseServerClient();

  // hidden_at 은 이번 스키마 변경으로 생겼다.
  // 스키마 재실행 + npm run gen:types 전까지는 생성 타입이 이 컬럼을 모른다
  const patch = { hidden_at: hidden ? new Date().toISOString() : null } as never;

  const { data, error } = await supabase
    .from("people")
    .update(patch)
    .eq("id", personId)
    .select("id, name");

  if (error) {
    return { ok: false, error: "바꾸지 못했어요. 다시 눌러주세요" };
  }

  // RLS 가 막으면 오류 없이 0행이 바뀐다. 오류만 봐서는 성공과 구분되지 않는다
  const row = data?.[0];
  if (row === undefined) {
    return { ok: false, error: "바꾸지 못했어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(
    supabase,
    auth.admin.email,
    hidden ? "hide_person" : "restore_person",
    { name: row.name },
  );
  revalidateAll();

  return { ok: true, data: undefined };
}

/**
 * 삭제.
 *
 * feedbacks 가 on delete cascade 라서 그 사람이 받은 제출과 사유도 함께 사라진다.
 * 되돌릴 수 없다. 화면에서 몇 개가 같이 지워지는지 보여준 뒤에 부른다.
 *
 * 지우기 전에 이름을 한 번 더 맞춰본다.
 * 목록을 열어둔 사이에 순서가 바뀌었다면 엉뚱한 사람을 지울 수 있다.
 */
export async function deletePerson(
  input: unknown,
): Promise<ActionResult<{ name: string; removedFeedbacks: number }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = DeleteInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "대상을 찾지 못했어요. 새로고침해주세요" };
  }

  const { personId, expectedName } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: person, error: readError } = await supabase
    .from("people")
    .select("id, name")
    .eq("id", personId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: "확인하지 못했어요. 다시 눌러주세요" };
  }
  if (person === null) {
    return { ok: false, error: "이미 지워진 사람이에요" };
  }
  if (person.name !== expectedName) {
    return {
      ok: false,
      error: "목록이 바뀌었어요. 새로고침한 뒤 다시 확인해주세요",
    };
  }

  // 몇 건이 같이 사라지는지 기록해둔다. 지운 뒤에는 셀 수 없다
  const { count } = await supabase
    .from("feedbacks")
    .select("id", { count: "exact", head: true })
    .eq("person_id", personId);

  const removedFeedbacks = count ?? 0;

  const { data: removed, error } = await supabase
    .from("people")
    .delete()
    .eq("id", personId)
    .select("id");

  if (error) {
    return { ok: false, error: "지우지 못했어요. 다시 눌러주세요" };
  }
  if (removed === null || removed.length === 0) {
    return { ok: false, error: "지우지 못했어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "delete_person", {
    name: person.name,
    removedFeedbacks,
  });
  revalidateAll();

  return { ok: true, data: { name: person.name, removedFeedbacks } };
}
