import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { AdminShell } from "@/features/admin/AdminShell";
import { EventCreatePanel } from "@/features/admin/EventCreatePanel";
import { RecentActivity } from "@/features/admin/RecentActivity";
import { ShareButton } from "@/features/insights/ShareButton";
import {
  getAdminDisplayNames,
  getEventPeopleCounts,
  getRecentActivity,
  requireAdmin,
} from "@/lib/auth/dal";
import { listEvents } from "@/lib/data/events";
import { adminEventHref, eventHref } from "@/lib/eventSlug";

/**
 * 관리자 홈 — 그룹 목록.
 *
 * 그룹마다 참여 주소가 따로 있다. 여기서 그룹을 고르면 그 그룹의 현황 · 명단으로 들어간다.
 * 링크는 여기서 바로 보낼 수 있게 둔다. 진행자가 가장 자주 찾는 것이 그 링크다.
 */
export default async function AdminHomePage() {
  // 권한 확인을 먼저 끝낸다. 조회와 나란히 두면 미인가일 때
  // 조회 쪽도 각자 거부되어 처리되지 않은 거부가 남는다.
  // 확인 결과는 cache() 에 담기므로 아래 조회들은 다시 확인하지 않는다
  const session = await requireAdmin();

  const [events, counts, entries, labels] = await Promise.all([
    listEvents(),
    getEventPeopleCounts(),
    getRecentActivity(),
    getAdminDisplayNames(),
  ]);

  return (
    <AdminShell session={session} title="관리자">
      <section className="mt-6">
        <h2 className="text-sm text-muted">그룹</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-base border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={adminEventHref(event.slug)} className="font-display text-lg">
                  {event.title}
                  {event.isSample && <span className="ml-2 text-sm text-warn">예시</span>}
                </Link>
                <span className="num text-sm text-muted">{counts.get(event.id) ?? 0}명</span>
              </div>
              <p className="num mt-1 text-sm text-muted">{eventHref(event.slug)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={adminEventHref(event.slug)}
                  className={buttonClass("primary", false, "sm")}
                >
                  관리
                </Link>
                <ShareButton
                  title={event.title}
                  path={eventHref(event.slug)}
                  label="참여 링크 보내기"
                  size="sm"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4">
        <EventCreatePanel />
      </div>

      <nav className="mt-6">
        <Link href="/admin/settings" className={buttonClass("secondary", true)}>
          관리자 관리
        </Link>
      </nav>

      <RecentActivity entries={entries} labels={labels} />
    </AdminShell>
  );
}
