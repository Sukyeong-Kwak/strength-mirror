import Link from "next/link";

import { buttonClass } from "@/components/Button";
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

  const [allPeople, status, entries, labels] = await Promise.all([
    getReceiptTotals(),
    getResultsStatus(),
    getRecentActivity(),
    getAdminDisplayNames(),
  ]);

  // 숨긴 사람은 현황에서 뺀다.
  // DB 의 결과 공개 게이트도 숨긴 사람을 빼고 세므로, 여기서 넣으면
  // "N명 미달" 과 실제 게이트가 서로 다른 말을 하게 된다.
  // 숨긴 사람을 보고 되돌리는 것은 /admin/people 에서 한다
  const totals = allPeople.filter((row) => !row.hidden);
  const hiddenCount = allPeople.length - totals.length;

  const groupCounts = new Map<string, number>();
  for (const row of totals) {
    groupCounts.set(row.groupName, (groupCounts.get(row.groupName) ?? 0) + 1);
  }

  return (
    <AdminShell session={session} title="관리자">
      <nav className="mt-4 flex flex-col gap-2">
        <Link href="/admin/people/import" className={buttonClass("secondary", true)}>
          명단 등록
        </Link>
        <Link href="/admin/people" className={buttonClass("secondary", true)}>
          명단 관리
        </Link>
        <Link href="/admin/settings" className={buttonClass("secondary", true)}>
          관리자 관리
        </Link>
        <Link href="/results" className={buttonClass("secondary", true)}>
          집계 보기
        </Link>
      </nav>

      <section className="mt-6 rounded-base border border-line bg-surface p-4">
        <h2 className="text-sm text-muted">등록 인원</h2>
        <p className="num mt-1 text-base">
          {totals.length}명
          {hiddenCount > 0 && (
            <span className="text-muted"> · 숨김 {hiddenCount}명</span>
          )}
        </p>
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
