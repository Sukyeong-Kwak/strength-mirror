/**
 * 집계 조회 — 개인 결과와 전체 통계.
 *
 * 로그인 없이 열리는 화면이라 `lib/auth/dal.ts` 를 쓰지 않는다 (`people.ts` 와 같은 이유).
 *
 * 여기서 읽는 뷰는 전부 비율만 내려준다. 건수 컬럼이 애초에 없다.
 * 결과는 언제든 열려 있고, 남긴 사람의 이름은 어떤 뷰에도 없다.
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
import type { ReasonEntry, StrengthRatioRow } from "@/types/domain";

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

/** 한 사람이 받은 강점 비율. 받은 것이 없으면 빈 배열 */
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
 * 남긴 사람의 이름은 뷰에 없다. 모두 익명으로 보여준다.
 */
export async function getPersonReasons(personId: string): Promise<ReasonEntry[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("feedback_reasons_public")
    .select("person_id, strength_code, reason, created_at")
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


/** Supabase 는 한 번에 1000행까지만 준다. 사람 × 강점은 그보다 많을 수 있다 */
const PAGE_SIZE = 1000;

type KeyedRaw = RawStrengthRow & { key: string | null };

async function fetchAllKeyed(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: KeyedRaw[] | null;
    error: unknown;
  }>,
  failMessage: string,
): Promise<Map<string, StrengthRatioRow[]>> {
  const out = new Map<string, StrengthRatioRow[]>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(failMessage);
    }
    const page = data ?? [];
    for (const raw of page) {
      if (raw.key === null) {
        continue;
      }
      const [row] = toStrengthRows([raw]);
      if (row === undefined) {
        continue;
      }
      const bucket = out.get(raw.key);
      if (bucket === undefined) {
        out.set(raw.key, [row]);
      } else {
        bucket.push(row);
      }
    }
    if (page.length < PAGE_SIZE) {
      return out;
    }
  }
}

/**
 * 모든 사람이 받은 강점 비율. 사람 id → 비율 행.
 *
 * "결이 비슷한 사람" 을 찾으려면 모두를 견줘봐야 한다.
 * 개인 결과와 같은 공개 뷰라서 새로 드러나는 것은 없다.
 */
export async function getAllPersonStrengthRatios(): Promise<
  Map<string, StrengthRatioRow[]>
> {
  const supabase = await createSupabaseServerClient();
  return fetchAllKeyed(
    (from, to) =>
      supabase
        .from("person_strength_ratio")
        .select("key:person_id, strength_code, name_ko, virtue, ratio")
        .order("person_id")
        .order("strength_code")
        .range(from, to),
    "결과를 불러오지 못했어요",
  );
}

/** 모든 조의 강점 비율. 조 이름 → 비율 행 */
export async function getAllGroupStrengthRatios(): Promise<
  Map<string, StrengthRatioRow[]>
> {
  const supabase = await createSupabaseServerClient();
  return fetchAllKeyed(
    (from, to) =>
      supabase
        .from("group_strength_ratio")
        .select("key:group_name, strength_code, name_ko, virtue, ratio")
        .order("group_name")
        .order("strength_code")
        .range(from, to),
    "조별 집계를 불러오지 못했어요",
  );
}
