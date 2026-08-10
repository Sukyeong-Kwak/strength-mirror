import Link from "next/link";

import { AdminShell } from "@/features/admin/AdminShell";
import { ReceiptStatusTable } from "@/features/admin/ReceiptStatusTable";
import { RecentActivity } from "@/features/admin/RecentActivity";
import { UnlockStatusCard } from "@/features/admin/UnlockStatusCard";
import {
  getAdminDisplayNames,
  getReceiptTotals,
  getRecentActivity,
  getResultsStatus,
  requireAdmin,
} from "@/lib/auth/dal";
import { sortGroupNames } from "@/lib/groups";

export default async function AdminHomePage() {
  // 권한 확인을 먼저 끝낸다. 조회와 나란히 두면 미인가일 때
  // 조회 쪽도 각자 거부되어 처리되지 않은 거부가 남는다.
  // 확인 결과는 cache() 에 담기므로 아래 조회들은 다시 확인하지 않는다
  const session = await requireAdmin();

  const [totals, status, entries, labels] = await Promise.all([
    getReceiptTotals(),
    getResultsStatus(),
    getRecentActivity(),
    getAdminDisplayNames(),
  ]);

  const groupCounts = new Map<string, number>();
  for (const row of totals) {
    groupCounts.set(row.groupName, (groupCounts.get(row.groupName) ?? 0) + 1);
  }

  return (
    <AdminShell session={session} title="관리자">
      <nav className="mt-4 flex flex-col gap-2">
        <Link
          href="/admin/people/import"
          className="min-h-11 rounded-base border border-line bg-surface px-4 py-3 text-base"
        >
          명단 등록
        </Link>
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

      <UnlockStatusCard unlocked={status.unlocked} totals={totals} />

      <ReceiptStatusTable totals={totals} registrarLabels={labels} />

      <RecentActivity entries={entries} labels={labels} />
    </AdminShell>
  );
}
