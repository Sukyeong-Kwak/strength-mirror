"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { SLUG_MAX_LENGTH, isValidSlug } from "@/lib/eventSlug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/** DB 의 check 제약(events)과 같은 길이 */
const TITLE_MAX_LENGTH = 40;
const INTRO_MAX_LENGTH = 300;

const SlugField = z
  .string()
  .trim()
  .max(SLUG_MAX_LENGTH)
  .refine(isValidSlug);

const TitleField = z.string().trim().min(1).max(TITLE_MAX_LENGTH);

/** 빈 인사말은 '없음' 이다. DB 의 check 제약이 빈 문자열을 거부한다 */
const IntroField = z
  .string()
  .trim()
  .max(INTRO_MAX_LENGTH)
  .nullable()
  .transform((value) => (value === null || value === "" ? null : value));

const CreateInput = z.object({
  slug: SlugField,
  title: TitleField,
  intro: IntroField,
});

const UpdateInput = z.object({
  eventId: z.uuid(),
  slug: SlugField,
  title: TitleField,
  intro: IntroField,
});

const INVALID_INPUT = `주소는 소문자 영문 · 숫자 · 하이픈으로 2~${SLUG_MAX_LENGTH}자, 행사 제목은 ${TITLE_MAX_LENGTH}자, 인사말은 ${INTRO_MAX_LENGTH}자까지 쓸 수 있어요`;

/** unique 위반 — 같은 주소를 이미 다른 그룹이 쓴다 */
const UNIQUE_VIOLATION = "23505";

async function adminOrError() {
  const session = await getAdminSession();
  if (session === null) {
    return { ok: false as const, error: "관리자만 쓸 수 있어요. 다시 로그인해주세요" };
  }
  return { ok: true as const, admin: session };
}

/**
 * 그룹 만들기. 주소(slug)와 행사 제목은 꼭 받는다.
 *
 * 예시 그룹은 여기서 만들지 않는다 (RLS 도 막는다). 예시는 하나만 있다.
 */
export async function createEvent(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = CreateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const { slug, title, intro } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .insert({ slug, title, intro, created_by: auth.admin.email })
    .select("slug");

  if (error) {
    return {
      ok: false,
      error:
        error.code === UNIQUE_VIOLATION
          ? `'${slug}' 주소는 이미 다른 그룹이 쓰고 있어요`
          : "만들지 못했어요. 다시 눌러주세요",
    };
  }
  // RLS 가 막으면 오류 없이 0행이 들어간다
  if (data === null || data.length === 0) {
    return { ok: false, error: "만들지 못했어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "create_event", { name: title, slug });
  revalidatePath("/admin");

  return { ok: true, data: { slug } };
}

/**
 * 그룹 고치기 — 주소 · 행사 제목 · 인사말.
 *
 * 주소를 바꾸면 이미 보낸 링크는 열리지 않는다. 화면에서 그 점을 알린다.
 * 명단과 받은 글은 그룹(id)에 붙어 있으므로 그대로 따라간다.
 */
export async function updateEvent(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const auth = await adminOrError();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const parsed = UpdateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: INVALID_INPUT };
  }

  const { eventId, slug, title, intro } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .update({ slug, title, intro })
    .eq("id", eventId)
    .select("slug");

  if (error) {
    return {
      ok: false,
      error:
        error.code === UNIQUE_VIOLATION
          ? `'${slug}' 주소는 이미 다른 그룹이 쓰고 있어요`
          : "고치지 못했어요. 다시 눌러주세요",
    };
  }
  if (data === null || data.length === 0) {
    return { ok: false, error: "고치지 못했어요. 다시 로그인한 뒤 시도해주세요" };
  }

  await writeAuditLog(supabase, auth.admin.email, "edit_event", { name: title, slug });
  // 그룹 제목은 참여 화면 곳곳에 나온다
  revalidatePath("/", "layout");

  return { ok: true, data: { slug } };
}
