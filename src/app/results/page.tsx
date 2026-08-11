import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { ResultChart, ViewToggle } from "@/features/results/ResultChart";
import { LockedNotice } from "@/features/results/LockedNotice";
import { UNASSIGNED_GROUP_LABEL } from "@/lib/constants";
import { listPeople } from "@/lib/data/people";
import {
  getGroupStrengthRatio,
  getOverallStrengthRatio,
  getResultsStatus,
} from "@/lib/data/results";
import { collectGroupNames } from "@/lib/groups";
import { josa } from "@/lib/korean";
import { isChartView, type ChartView } from "@/types/domain";

type ResultsPageProps = {
  searchParams: Promise<{ view?: string; group?: string }>;
};

export const metadata: Metadata = {
  title: "전체 집계",
  robots: { index: false, follow: false },
};

const ALL_GROUPS = "전체";

/**
 * 전체 통계 (13단계).
 *
 * 개인 결과와 같은 차트를 쓰고, 무엇을 집계했는지만 다르다.
 *
 * 조별 보기는 조 이름이 있는 사람만 볼 수 있다. '미지정' 은 DB 에서
 * group_name 이 null 이라 조별 뷰가 묶지 않는다. 목록에서 빼서
 * 눌렀는데 빈 화면이 나오는 일이 없게 한다.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { view: rawView, group: rawGroup } = await searchParams;
  const view: ChartView = isChartView(rawView) ? rawView : "strength";

  const status = await getResultsStatus();

  if (!status.unlocked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Link href="/" className={buttonClass("secondary", false, "sm")}>
          명단으로
        </Link>
        <h1 className="mt-4 text-2xl">전체 집계</h1>
        <div className="mt-6">
          <LockedNotice remaining={status.remaining} />
        </div>
      </main>
    );
  }

  const people = await listPeople();
  const groups = collectGroupNames(people).filter(
    (name) => name !== UNASSIGNED_GROUP_LABEL,
  );

  // 없는 조 이름이 쿼리로 들어오면 전체로 되돌린다
  const group =
    rawGroup !== undefined && groups.includes(rawGroup) ? rawGroup : ALL_GROUPS;

  const strengthRows =
    group === ALL_GROUPS
      ? await getOverallStrengthRatio()
      : await getGroupStrengthRatio(group);

  function hrefFor(nextView: ChartView, nextGroup: string): string {
    const query = new URLSearchParams({ view: nextView });
    if (nextGroup !== ALL_GROUPS) {
      query.set("group", nextGroup);
    }
    return `/results?${query.toString()}`;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/" className={buttonClass("secondary", false, "sm")}>
        명단으로
      </Link>

      <h1 className="mt-4 text-2xl">전체 집계</h1>
      <p className="mt-1 text-sm text-muted">
        {group === ALL_GROUPS
          ? "모두가 받은 강점"
          : `${group}${josa(group, "이/가")} 받은 강점`}
      </p>

      <div className="mt-4">
        <ViewToggle view={view} hrefFor={(next) => hrefFor(next, group)} />
      </div>

      {groups.length > 1 && (
        <div className="mt-3 -mx-4 overflow-x-auto px-4">
          <div className="flex w-max gap-2">
            {[ALL_GROUPS, ...groups].map((name) => (
              <Link
                key={name}
                href={hrefFor(view, name)}
                aria-current={name === group ? "page" : undefined}
                className={buttonClass(
                  name === group ? "primary" : "secondary",
                  false,
                  "sm",
                )}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <ResultChart view={view} strengthRows={strengthRows} />
      </div>
    </main>
  );
}
