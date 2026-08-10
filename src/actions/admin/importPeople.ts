"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/**
 * 한 번에 등록할 수 있는 최대 인원.
 * 실수로 긴 글을 통째로 붙여넣었을 때 수백 행이 들어가는 것을 막는다.
 */
const MAX_IMPORT_ROWS = 300;

const PersonInput = z.object({
  name: z.string().trim().min(1).max(40),
  // 빈 문자열은 '조 없음' 으로 본다. DB 의 check 제약이 빈 문자열을 거부한다
  groupName: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .transform((value) => (value === null || value === "" ? null : value)),
});

const ImportInput = z.object({
  people: z.array(PersonInput).min(1).max(MAX_IMPORT_ROWS),
});

export type ImportResult = {
  /** 실제로 등록된 수 */
  added: number;
  /** 이미 있어서 건너뛴 수 */
  skipped: number;
};

/** 중복 판정 키. parsePeople 의 규칙과 같아야 한다 */
function dedupeKey(name: string, groupName: string | null): string {
  return `${name.trim().replace(/\s+/g, " ").toLowerCase()} ${groupName ?? ""}`;
}

/**
 * 명단 일괄 등록.
 *
 * 화면에서 이미 중복을 걸렀더라도 여기서 다시 본다.
 * 미리보기는 화면을 연 시점의 명단으로 판단하므로,
 * 그사이 다른 관리자가 등록했으면 어긋난다.
 *
 * people 에는 DELETE 정책이 없다. 한 번 등록하면 지울 수 없으므로
 * 화면에서 되돌릴 수 없다는 것을 분명히 알린 뒤에 부른다.
 */
export async function importPeople(input: unknown): Promise<ActionResult<ImportResult>> {
  const admin = await getAdminSession();
  if (admin === null) {
    return { ok: false, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }

  const parsed = ImportInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: `등록할 명단을 확인해주세요. 한 번에 ${MAX_IMPORT_ROWS}명까지 등록할 수 있어요`,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: readError } = await supabase
    .from("people")
    .select("name, group_name");

  if (readError) {
    return { ok: false, error: "기존 명단을 확인하지 못했어요. 다시 눌러주세요" };
  }

  const known = new Set(
    (existing ?? []).map((row) => dedupeKey(row.name, row.group_name)),
  );

  // 붙여넣은 글 안의 중복도 여기서 한 번 더 접는다
  const rows: Array<{ name: string; group_name: string | null; created_by: string }> =
    [];

  for (const person of parsed.data.people) {
    const key = dedupeKey(person.name, person.groupName);
    if (known.has(key)) {
      continue;
    }
    known.add(key);
    rows.push({
      name: person.name,
      group_name: person.groupName,
      // 정책이 본인 이메일만 허용한다
      created_by: admin.email,
    });
  }

  const skipped = parsed.data.people.length - rows.length;

  if (rows.length === 0) {
    return { ok: false, error: "새로 등록할 사람이 없어요. 전부 이미 등록돼 있어요" };
  }

  const { data: inserted, error } = await supabase
    .from("people")
    .insert(rows)
    .select("id");

  if (error) {
    return { ok: false, error: "등록하지 못했어요. 다시 눌러주세요" };
  }

  // RLS 가 막으면 오류 없이 0행이 들어간다. 오류만 봐서는 성공과 구분되지 않는다
  const added = inserted?.length ?? 0;
  if (added === 0) {
    return { ok: false, error: "등록되지 않았어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, admin.email, "import_people", { count: added });

  revalidatePath("/admin");
  revalidatePath("/admin/people/import");
  revalidatePath("/");

  return { ok: true, data: { added, skipped } };
}
