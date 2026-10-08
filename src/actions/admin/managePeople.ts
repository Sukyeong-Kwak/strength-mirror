"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { UNASSIGNED_GROUP_LABEL } from "@/lib/constants";
import { readPeopleRows } from "@/lib/data/people";
import { josa } from "@/lib/korean";
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

const NameField = z.string().trim().min(1).max(40);

/**
 * 조 이름. 빈 문자열과 '미지정' 은 조 없음(null) 으로 본다.
 * 화면은 조 없는 사람을 '미지정' 으로 보여주므로, 그 글자를 그대로 저장하면
 * '미지정' 이라는 진짜 조가 하나 더 생겨 두 묶음이 같은 이름으로 갈라진다
 */
const GroupField = z
  .string()
  .trim()
  .max(40)
  .nullable()
  .transform((value) =>
    value === null || value === "" || value === UNASSIGNED_GROUP_LABEL ? null : value,
  );

const AddInput = z.object({
  /** 등록할 그룹 */
  eventId: z.uuid(),
  name: NameField,
  groupName: GroupField,
});

const UpdateInput = z.object({
  personId: z.uuid(),
  /** 화면에 보이던 이름. 목록이 낡았는지 확인하는 용도 */
  expectedName: NameField,
  name: NameField,
  groupName: GroupField,
});

/** 중복 판정 키. importPeople · parsePeople 의 규칙과 같아야 한다 */
function dedupeKey(name: string, groupName: string | null): string {
  return `${name.trim().replace(/\s+/g, " ").toLowerCase()} ${groupName ?? ""}`;
}

async function adminOrError() {
  const session = await getAdminSession();
  if (session === null) {
    return { ok: false as const, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }
  return { ok: true as const, admin: session };
}

/** 관리 화면과 그 그룹의 참여 화면이 모두 바뀐다 */
function revalidateAll() {
  revalidatePath("/", "layout");
}

/**
 * 한 명 바로 등록.
 *
 * 붙여넣기 등록과 같은 규칙으로, 같은 조에 같은 이름이 있으면 받지 않는다.
 * 동명이인이라면 조를 달리 하거나 이름에 구분을 붙여 등록한다.
 *
 * 중복은 같은 그룹 안에서만 본다. 다른 그룹의 '김하늘' 은 다른 사람이다.
 */
export async function addPerson(
  input: unknown,
): Promise<ActionResult<{ name: string; groupName: string | null }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = AddInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "이름은 1~40자, 조 이름은 40자까지 쓸 수 있어요" };
  }

  const { eventId, name, groupName } = parsed.data;
  const supabase = await createSupabaseServerClient();

  let existing: Awaited<ReturnType<typeof readPeopleRows>>;
  try {
    existing = await readPeopleRows(eventId);
  } catch {
    return { ok: false, error: "기존 명단을 확인하지 못했어요. 다시 눌러주세요" };
  }

  const key = dedupeKey(name, groupName);
  const clash = existing.some((row) => dedupeKey(row.name, row.group_name) === key);
  if (clash) {
    return {
      ok: false,
      error: `${groupName ?? UNASSIGNED_GROUP_LABEL}에 이미 ${name}${josa(name, "이/가")} 있어요`,
    };
  }

  const { data: inserted, error } = await supabase
    .from("people")
    .insert({
      event_id: eventId,
      name,
      group_name: groupName,
      created_by: auth.admin.email,
    })
    .select("id");

  if (error) {
    return { ok: false, error: "등록하지 못했어요. 다시 눌러주세요" };
  }
  // RLS 가 막으면 오류 없이 0행이 들어간다
  if (inserted === null || inserted.length === 0) {
    return { ok: false, error: "등록되지 않았어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "add_person", {
    name,
    group: groupName,
  });
  revalidateAll();

  return { ok: true, data: { name, groupName } };
}

/**
 * 이름 · 조 고치기.
 *
 * 받은 글은 사람(id)에 붙어 있으므로 이름이나 조를 바꿔도 그대로 따라간다.
 * 삭제와 같은 까닭으로 고치기 전에 이름을 한 번 더 맞춰본다.
 */
export async function updatePerson(
  input: unknown,
): Promise<ActionResult<{ name: string; groupName: string | null }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = UpdateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "이름은 1~40자, 조 이름은 40자까지 쓸 수 있어요" };
  }

  const { personId, expectedName, name, groupName } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: target, error: targetError } = await supabase
    .from("people")
    .select("event_id")
    .eq("id", personId)
    .maybeSingle();
  if (targetError) {
    return { ok: false, error: "확인하지 못했어요. 다시 눌러주세요" };
  }
  if (target === null) {
    return { ok: false, error: "이미 지워진 사람이에요. 새로고침해주세요" };
  }

  // 같은 그룹 사람들과만 견준다
  let everyone: Awaited<ReturnType<typeof readPeopleRows>>;
  try {
    everyone = await readPeopleRows(target.event_id);
  } catch {
    return { ok: false, error: "확인하지 못했어요. 다시 눌러주세요" };
  }

  const person = everyone.find((row) => row.id === personId);
  if (person === undefined) {
    return { ok: false, error: "이미 지워진 사람이에요. 새로고침해주세요" };
  }
  if (person.name !== expectedName) {
    return {
      ok: false,
      error: "목록이 바뀌었어요. 새로고침한 뒤 다시 확인해주세요",
    };
  }
  if (person.name === name && person.group_name === groupName) {
    return { ok: false, error: "바뀐 것이 없어요" };
  }

  const key = dedupeKey(name, groupName);
  const clash = everyone.some(
    (row) => row.id !== personId && dedupeKey(row.name, row.group_name) === key,
  );
  if (clash) {
    return {
      ok: false,
      error: `${groupName ?? UNASSIGNED_GROUP_LABEL}에 이미 ${name}${josa(name, "이/가")} 있어요`,
    };
  }

  // name·group_name 의 update 권한은 이번 스키마 변경으로 열렸다.
  // 스키마를 다시 실행하기 전에는 42501 로 막힌다
  const { data: updated, error } = await supabase
    .from("people")
    .update({ name, group_name: groupName })
    .eq("id", personId)
    .select("id");

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "DB 권한이 아직 열리지 않았어요. supabase/schema.sql 을 다시 실행해주세요"
          : "고치지 못했어요. 다시 눌러주세요",
    };
  }
  if (updated === null || updated.length === 0) {
    return { ok: false, error: "고치지 못했어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "edit_person", {
    name,
    from: { name: person.name, group: person.group_name },
    to: { name, group: groupName },
  });
  revalidateAll();

  return { ok: true, data: { name, groupName } };
}

/**
 * 숨기기 · 되돌리기.
 *
 * 숨기면 목록과 집계, 결과에서 빠진다.
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
