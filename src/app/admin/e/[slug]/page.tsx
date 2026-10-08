import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { AdminShell } from "@/features/admin/AdminShell";
import { EventSettingsPanel } from "@/features/admin/EventSettingsPanel";
import { ReceiptStatusTable } from "@/features/admin/ReceiptStatusTable";
import { SampleDataPanel } from "@/features/admin/SampleDataPanel";
import { ShareButton } from "@/features/insights/ShareButton";
import { getAdminDisplayNames, getReceiptTotals, requireAdminEvent } from "@/lib/auth/dal";
import { adminEventHref, eventHref } from "@/lib/eventSlug";
import { sortGroupNames } from "@/lib/groups";

type AdminEventPageProps = {
  params: Promise<{ slug: string }>;
};

/** 한 그룹의 관리 화면 — 참여 링크, 그룹 정보, 현황 */
export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { slug } = await params;
  // 권한 확인과 그룹 찾기를 먼저 끝낸다 (관리자 홈과 같은 까닭)
  const { session, event } = await requireAdminEvent(slug);

  const [everyone, labels] = await Promise.all([
    getReceiptTotals(event.id),
    getAdminDisplayNames(),
  ]);

  // 숨긴 사람은 현황에서 뺀다.
  // DB 의 집계 뷰도 숨긴 사람을 빼고 세므로, 여기서 넣으면
  // 현황과 집계가 서로 다른 말을 하게 된다.
  // 숨긴 사람을 보고 되돌리는 것은 명단 관리에서 한다
  const totals = everyone.filter((row) => !row.hidden);
  const hiddenCount = everyone.length - totals.length;

  const groupCounts = new Map<string, number>();
  for (const row of totals) {
    groupCounts.set(row.groupName, (groupCounts.get(row.groupName) ?? 0) + 1);
  }

  const joinHref = eventHref(event.slug);

  return (
    <AdminShell session={session} title={event.title} backHref="/admin">
      {/* 진행자가 가장 자주 찾는 것. 맨 위에 둔다 */}
      <section className="mt-6 rounded-base border border-line bg-surface p-4">
        <h2 className="text-sm text-muted">참여 링크</h2>
        <p className="num mt-1 text-base">{joinHref}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ShareButton title={event.title} path={joinHref} label="참여 링크 보내기" size="sm" />
          <Link href={joinHref} className={buttonClass("secondary", false, "sm")}>
            참여 화면 열기
          </Link>
        </div>
      </section>

      {event.isSample && <SampleDataPanel count={totals.length} />}

      <nav className="mt-4 flex flex-col gap-2">
        <Link
          href={adminEventHref(event.slug, "/people/import")}
          className={buttonClass("secondary", true)}
        >
          명단 등록
        </Link>
        <Link href={adminEventHref(event.slug, "/people")} className={buttonClass("secondary", true)}>
          명단 관리
        </Link>
        <Link href={eventHref(event.slug, "/results")} className={buttonClass("secondary", true)}>
          집계 보기
        </Link>
        <a
          href={eventHref(event.slug, "/results/report")}
          download
          className={buttonClass("secondary", true)}
        >
          전체 결과 PDF 받기
        </a>
      </nav>

      <section className="mt-6 rounded-base border border-line bg-surface p-4">
        <h2 className="text-sm text-muted">{event.isSample ? "예시 인원" : "등록 인원"}</h2>
        <p className="num mt-1 text-base">
          {totals.length}명
          {hiddenCount > 0 && <span className="text-muted"> · 숨김 {hiddenCount}명</span>}
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

      <ReceiptStatusTable
        totals={totals}
        registrarLabels={labels}
        importHref={adminEventHref(event.slug, "/people/import")}
      />

      <EventSettingsPanel event={event} />
    </AdminShell>
  );
}
