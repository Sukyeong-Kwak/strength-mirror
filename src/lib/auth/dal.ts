import { redirect } from "next/navigation";
import { cache } from "react";

import { RECENT_ACTIVITY_LIMIT } from "@/lib/constants";
import { toGroupLabel } from "@/lib/groups";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/time";
import {
  isAdminAction,
  type AdminActivity,
  type AdminEntry,
  type PersonTotals,
  type ResultsStatus,
} from "@/types/domain";

import { getAdminSession, type AdminSession } from "./admin";

/**
 * 관리자 데이터 접근 계층.
 *
 * 권한 확인과 조회를 한 함수 안에 묶는다.
 * 페이지가 조회 함수를 부르는 순간 확인이 이미 끝나 있으므로,
 * 새 관리자 화면을 만들 때 확인을 빠뜨릴 수가 없다.
 *
 * 레이아웃에서 막지 않는 이유: 레이아웃은 그 아래 page 가 실행되는 것을
 * 막지 못하고 RSC 페이로드에도 실린다. 확인은 데이터에 가장 가까운 곳에서 한다.
 *
 * 이 파일은 next/headers 에 의존하므로 클라이언트에서 import 하면 빌드가 깨진다.
 * (server-only 패키지를 따로 쓰지 않는 이유다)
 */

/**
 * 관리자가 아니면 세션을 끊고 로그인 화면으로 보낸다.
 *
 * cache() 로 감싸 한 요청 안에서는 실제 조회가 한 번만 일어난다.
 * 조회 함수를 여러 개 불러도 auth.getUser() + 허용목록 조회는 1회다.
 *
 * 서버 컴포넌트는 쿠키를 쓸 수 없어 여기서 직접 로그아웃시킬 수 없다.
 * 그래서 쿠키를 지울 수 있는 라우트 핸들러로 보낸다.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const session = await getAdminSession();
  if (session === null) {
    redirect("/admin/auth/signout?reason=forbidden");
  }
  return session;
});

/**
 * 뷰는 모든 컬럼이 nullable 로 생성된다. 화면용 타입으로 좁힌다.
 * 사람을 식별할 수 없는 행은 버린다.
 */
type PersonTotalsRow = {
  person_id: string | null;
  name: string | null;
  group_name: string | null;
  created_by: string | null;
  submission_count: number | null;
  strength_count: number | null;
};

function toPersonTotals(row: PersonTotalsRow): PersonTotals | null {
  if (row.person_id === null || row.name === null) {
    return null;
  }
  return {
    personId: row.person_id,
    name: row.name,
    groupName: toGroupLabel(row.group_name),
    createdBy: row.created_by,
    submissionCount: row.submission_count ?? 0,
    strengthCount: row.strength_count ?? 0,
  };
}

/**
 * 수신 현황.
 *
 * person_totals_internal 은 is_admin() 인 사용자에게만 열려 있다.
 * 정렬을 지정하지 않으면 행 순서가 매번 달라져 화면이 흔들린다.
 */
export async function getReceiptTotals(): Promise<PersonTotals[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("person_totals_internal")
    .select(
      "person_id, name, group_name, created_by, submission_count, strength_count",
    )
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });

  // 빈 배열로 넘기면 "등록 인원 0명" 이라는 정반대 화면이 된다.
  // 조회 실패는 삼키지 않고 에러 바운더리로 보낸다
  if (error) {
    throw new Error("수신 현황을 불러오지 못했어요");
  }

  return (data ?? [])
    .map(toPersonTotals)
    .filter((row): row is PersonTotals => row !== null);
}

/** 결과 공개 게이트 상태 */
export async function getResultsStatus(): Promise<ResultsStatus> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("results_status")
    .select("unlocked, remaining")
    .maybeSingle();

  if (error) {
    throw new Error("공개 상태를 불러오지 못했어요");
  }

  return {
    unlocked: data?.unlocked === true,
    remaining: data?.remaining ?? 0,
  };
}

/** 최근 활동. action 은 CHECK 제약이라 생성 타입이 string 이다. 아는 값만 통과시킨다 */
export async function getRecentActivity(): Promise<AdminActivity[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_email, action, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_ACTIVITY_LIMIT);

  if (error) {
    throw new Error("최근 활동을 불러오지 못했어요");
  }

  return (data ?? []).flatMap((row) =>
    isAdminAction(row.action)
      ? [
          {
            id: row.id,
            adminEmail: row.admin_email,
            action: row.action,
            detail: row.detail,
            createdAt: row.created_at,
          },
        ]
      : [],
  );
}

/**
 * 허용목록. 등록 순서대로 둔다.
 * 표시 이름 조회(getAdminDisplayNames)가 같은 목록을 쓰므로 cache() 로 감싼다.
 */
export const getAdminAllowlist = cache(async (): Promise<AdminEntry[]> => {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_allowlist")
    .select("email, label, added_by, created_at")
    .order("created_at", { ascending: true });

  // 실패했는데 빈 목록을 넘기면 "마지막 관리자는 제거할 수 없어요" 라는
  // 정반대 안내가 뜬다. 던져서 에러 화면을 보여준다
  if (error) {
    throw new Error("관리자 목록을 불러오지 못했어요");
  }

  return (data ?? []).map((row) => ({
    email: row.email,
    label: row.label,
    addedBy: row.added_by,
    addedAtLabel: formatRelativeTime(row.created_at),
  }));
});

/** 이메일 → 표시 이름. 활동 기록에 이메일 대신 이름을 쓰기 위한 것 */
export async function getAdminDisplayNames(): Promise<Map<string, string>> {
  const entries = await getAdminAllowlist();
  return new Map(entries.map((entry) => [entry.email, entry.label ?? entry.email]));
}
