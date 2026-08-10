/**
 * 집계 조회 — 개인 결과와 전체 통계.
 *
 * 로그인 없이 열리는 화면이라 `lib/auth/dal.ts` 를 쓰지 않는다 (`people.ts` 와 같은 이유).
 *
 * 여기서 읽는 뷰는 전부 비율만 내려준다. 건수 컬럼이 애초에 없고,
 * 결과 공개 게이트가 잠겨 있으면 행 자체가 오지 않는다.
 * 그래서 화면에서 게이트를 확인하는 것은 안내 문구를 고르기 위한 것일 뿐,
 * 잠금 자체는 anon 키로 직접 조회해도 뚫리지 않는다.
 *
 * 강점 이름은 DB 의 name_ko 가 아니라 `lib/strengths.ts` 를 쓴다.
 * 문구의 원본이 한 곳이어야 이름을 고칠 때 마이그레이션이 필요 없다.
 *
 * 덕목 뷰(`person_virtue_ratio` · `overall_virtue_ratio` · `group_virtue_ratio`)는
 * 일부러 읽지 않는다. 그쪽은 강점과 따로 5% 눈금에 올리기 때문에 같은 덕목이
 * 덕목별 보기에서 40%, 강점별 보기의 소계에서 35% 로 갈릴 수 있다.
 * 화면은 강점 비율 하나만 받아서 덕목을 더해 만든다 (`lib/ratio.ts`).
 */

import { findStrength, isStrengthCode, isVirtueCode } from "@/lib/strengths";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReasonEntry, ResultsStatus, StrengthRatioRow } from "@/types/domain";

/** 뷰의 컬럼은 전부 nullable 로 생성된다. 화면에 넘기기 전에 여기서 걸러낸다 */
type RawStrengthRow = {
  strength_code: string | null;
  name_ko: string | null;
  virtue: string | null;
  ratio: number | null;
};

function toStrengthRows(rows: readonly RawStrengthRow[]): StrengthRatioRow[] {
  const out: StrengthRatioRow[] = [];

  for (const row of rows) {
    // 코드가 우리 목록에 없으면 그린다 해도 이름을 붙일 수 없다. 조용히 버린다
    if (!isStrengthCode(row.strength_code) || !isVirtueCode(row.virtue)) {
      continue;
    }
    if (row.ratio === null) {
      continue;
    }
    out.push({
      strengthCode: row.strength_code,
      nameKo: findStrength(row.strength_code)?.nameKo ?? row.name_ko ?? row.strength_code,
      virtue: row.virtue,
      ratio: row.ratio,
    });
  }

  return out;
}

/**
 * 결과 공개 게이트 상태.
 *
 * 관리자 화면의 것과 같은 뷰를 보지만 이쪽은 로그인 없이 부른다.
 * 뷰가 내려주는 것은 열렸는지와 남은 사람 수뿐이고, 누가 몇 개 받았는지는 없다.
 */
export async function getResultsStatus(): Promise<ResultsStatus> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("results_status")
    .select("unlocked, remaining")
    .limit(1);

  // 못 읽었을 때 열린 것으로 보면 잠겨야 할 화면이 열린다. 잠긴 쪽으로 기운다
  if (error) {
    return { unlocked: false, remaining: 0 };
  }

  const row = (data ?? [])[0];
  return {
    unlocked: row?.unlocked ?? false,
    remaining: row?.remaining ?? 0,
  };
}

/** 한 사람이 받은 강점 비율. 게이트가 잠겨 있으면 빈 배열 */
export async function getPersonStrengthRatio(
  personId: string,
): Promise<StrengthRatioRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("person_strength_ratio")
    .select("strength_code, name_ko, virtue, ratio")
    .eq("person_id", personId);

  if (error) {
    throw new Error("결과를 불러오지 못했어요");
  }

  return toStrengthRows(data ?? []);
}


/**
 * 한 사람이 받은 사유 카드.
 *
 * 뷰에 이미 게이트가 걸려 있다. 잠겨 있으면 0행이다.
 * 카드 수를 세면 그 사람이 받은 강점 수가 되므로 게이트 밖으로 새면 안 된다.
 */
export async function getPersonReasons(personId: string): Promise<ReasonEntry[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("feedback_reasons_public")
    .select("person_id, strength_code, reason, author_name, created_at")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("남겨준 글을 불러오지 못했어요");
  }

  const out: ReasonEntry[] = [];
  for (const row of data ?? []) {
    if (!isStrengthCode(row.strength_code) || row.reason === null) {
      continue;
    }
    out.push({
      personId: row.person_id ?? personId,
      strengthCode: row.strength_code,
      reason: row.reason,
      authorName: row.author_name,
      createdAt: row.created_at ?? "",
    });
  }
  return out;
}

/** 전체 강점 비율 */
export async function getOverallStrengthRatio(): Promise<StrengthRatioRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("overall_strength_ratio")
    .select("strength_code, name_ko, virtue, ratio");

  if (error) {
    throw new Error("전체 집계를 불러오지 못했어요");
  }

  return toStrengthRows(data ?? []);
}


/** 조별 강점 비율. 조 이름과 함께 내려준다 */
export async function getGroupStrengthRatio(
  groupName: string,
): Promise<StrengthRatioRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("group_strength_ratio")
    .select("group_name, strength_code, name_ko, virtue, ratio")
    .eq("group_name", groupName);

  if (error) {
    throw new Error("조별 집계를 불러오지 못했어요");
  }

  return toStrengthRows(data ?? []);
}

