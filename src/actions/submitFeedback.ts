"use server";

import { z } from "zod";

import {
  MAX_AUTHOR_NAME_LENGTH,
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
} from "@/lib/constants";
import { getPerson } from "@/lib/data/people";
import { isStrengthCode } from "@/lib/strengths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

/**
 * 강점 하나를 남긴다.
 *
 * 한 번에 하나씩 보낸다. DB 의 submit_feedback 은 1~5개를 받지만
 * 화면이 하나씩 확인받고 저장하는 흐름이라 항목이 항상 한 개다.
 *
 * 로그인하지 않은 사람이 부르는 유일한 쓰기 경로다.
 * 제출자를 식별하는 값은 보내지 않는다. 이름을 스스로 적었을 때만 남는다.
 */

const SubmitInput = z.object({
  personId: z.uuid(),
  /** 화면에서 만든 멱등 키. 같은 키로 두 번 오면 서버가 두 번째를 버린다 */
  submissionKey: z.uuid(),
  strengthCode: z.string().refine(isStrengthCode),
  reason: z.string().trim().min(MIN_REASON_LENGTH).max(MAX_REASON_LENGTH),
  /** 비어 있으면 익명 */
  authorName: z.string().trim().max(MAX_AUTHOR_NAME_LENGTH),
});

export async function submitFeedback(input: unknown): Promise<ActionResult> {
  const parsed = SubmitInput.safeParse(input);
  if (!parsed.success) {
    // 어떤 칸이 틀렸는지는 화면이 이미 막고 있다. 여기까지 왔다면 화면 밖에서 온 것이다
    return { ok: false, error: `사유를 ${MIN_REASON_LENGTH}자 이상 적어주세요` };
  }

  const { personId, submissionKey, strengthCode, reason, authorName } = parsed.data;

  // 숨긴 사람에게는 남길 수 없다.
  // RPC 는 security definer 라 RLS 를 지나치므로 여기서 막아야 한다
  const person = await getPerson(personId);
  if (person === null) {
    return { ok: false, error: "지금은 이 사람에게 남길 수 없어요" };
  }

  const supabase = await createSupabaseServerClient();

  // 생성 타입에 옛 시그니처(p_client_id)가 남아 있어 그대로는 컴파일되지 않는다.
  // 스키마 재실행 + npm run gen:types 뒤에 이 캐스팅을 지운다
  const args = {
    p_person_id: personId,
    p_author_name: authorName === "" ? null : authorName,
    p_submission_key: submissionKey,
    p_items: [{ code: strengthCode, reason }],
  } as never;

  const { error } = await supabase.rpc("submit_feedback", args);

  if (error) {
    // 같은 키를 다른 사람에게 다시 쓴 경우. 화면을 새로 열면 키도 새로 만들어진다
    if (error.message.includes("already used for another person")) {
      return { ok: false, error: "화면을 새로 고친 뒤 다시 남겨주세요" };
    }
    return { ok: false, error: "저장하지 못했어요. 잠시 뒤에 다시 눌러주세요" };
  }

  return { ok: true, data: undefined };
}
