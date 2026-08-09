import Link from "next/link";
import { redirect } from "next/navigation";

import {
  RecentActivity,
  type ActivityEntry,
} from "@/features/admin/RecentActivity";
import { ReceiptStatusTable } from "@/features/admin/ReceiptStatusTable";
import { AdminShell } from "@/features/admin/AdminShell";
import { UnlockStatusCard } from "@/features/admin/UnlockStatusCard";
import { getAdminSession } from "@/lib/auth/admin";
import { RECENT_ACTIVITY_LIMIT, UNASSIGNED_GROUP_LABEL } from "@/lib/constants";
import { sortGroupNames } from "@/lib/groups";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminAction, type PersonTotals } from "@/types/domain";

type PersonTotalsRow = {
  person_id: string | null;
  name: string | null;
  group_name: string | null;
  created_by: string | null;
  submission_count: number | null;
  strength_count: number | null;
};

/** 뷰는 모든 컬럼이 nullable 로 생성된다. 화면용 타입으로 좁힌다 */
function toPersonTotals(row: PersonTotalsRow): PersonTotals | null {
  if (row.person_id === null || row.name === null) {
    return null;
  }
  return {
    personId: row.person_id,
    name: row.name,
    groupName: row.group_name ?? UNASSIGNED_GROUP_LABEL,
    createdBy: row.created_by,
    submissionCount: row.submission_count ?? 0,
    strengthCount: row.strength_count ?? 0,
  };
}

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (session === null) {
    redirect("/admin/login?error=forbidden&next=%2Fadmin");
  }

  const supabase = await createSupabaseServerClient();

  const [totalsResult, statusResult, auditResult, allowlistResult] =
    await Promise.all([
      supabase
        .from("person_totals_internal")
        .select(
          "person_id, name, group_name, created_by, submission_count, strength_count",
        ),
      supabase.from("results_status").select("unlocked, remaining").maybeSingle(),
      supabase
        .from("admin_audit_log")
        .select("id, admin_email, action, detail, created_at")
        .order("created_at", { ascending: false })
        .limit(RECENT_ACTIVITY_LIMIT),
      supabase.from("admin_allowlist").select("email, label"),
    ]);

  const totals: PersonTotals[] = (totalsResult.data ?? [])
    .map(toPersonTotals)
    .filter((row): row is PersonTotals => row !== null);

  const labels = new Map<string, string>(
    (allowlistResult.data ?? []).map((row) => [row.email, row.label ?? row.email]),
  );

  // action 은 CHECK 제약이라 생성 타입이 string 이다. 아는 값만 통과시킨다
  const entries: ActivityEntry[] = (auditResult.data ?? []).flatMap((row) =>
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

  const groupCounts = new Map<string, number>();
  for (const row of totals) {
    groupCounts.set(row.groupName, (groupCounts.get(row.groupName) ?? 0) + 1);
  }

  return (
    <AdminShell session={session} title="관리자">
      <nav className="mt-4 flex flex-col gap-2">
        <Link
          href="/admin/settings"
          className="min-h-11 rounded-base border border-line bg-surface px-4 py-3 text-base"
        >
          관리자 관리
        </Link>
      </nav>

      <section className="mt-6 rounded-base border border-line bg-surface p-4">
        <h2 className="text-sm text-muted">등록 인원</h2>
        <p className="num mt-1 text-base">{totals.length}명</p>
        {groupCounts.size > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {sortGroupNames([...groupCounts.keys()]).map((group) => (
              <li key={group} className="num">
                {group} {groupCounts.get(group) ?? 0}명
              </li>
            ))}
          </ul>
        )}
      </section>

      <UnlockStatusCard
        unlocked={statusResult.data?.unlocked === true}
        totals={totals}
      />

      <ReceiptStatusTable totals={totals} />

      <RecentActivity entries={entries} labels={labels} />
    </AdminShell>
  );
}
