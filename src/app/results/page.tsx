import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { ExploreCards } from "@/features/home/ExploreCards";
import { GroupProfiles } from "@/features/insights/GroupProfiles";
import { HiddenStrengths } from "@/features/insights/HiddenStrengths";
import { InsightSection, SectionNav, type SectionLink } from "@/features/insights/SectionNav";
import { ResultChart, ViewToggle } from "@/features/results/ResultChart";
import { UNASSIGNED_GROUP_LABEL } from "@/lib/constants";
import { listPeople } from "@/lib/data/people";
import {
  getAllGroupStrengthRatios,
  getGroupStrengthRatio,
  getOverallStrengthRatio,
} from "@/lib/data/results";
import { collectGroupNames } from "@/lib/groups";
import { groupProfiles, hiddenStrengths } from "@/lib/insights";
import { josa } from "@/lib/korean";
import { pickChartView, type ChartView } from "@/types/domain";

type ResultsPageProps = {
  searchParams: Promise<{ view?: string; group?: string }>;
};

export const metadata: Metadata = {
  title: "모두의 강점",
  robots: { index: false, follow: false },
};

const ALL_GROUPS = "전체";

/**
 * 전체 통계 (13단계).
 *
 * 개인 결과와 같은 차트를 쓰고, 무엇을 집계했는지만 다르다.
 * 언제든 열린다. 아직 받은 강점이 없으면 차트가 빈 상태를 보여준다.
 *
 * 조별 보기는 조 이름이 있는 사람만 볼 수 있다. '미지정' 은 DB 에서
 * group_name 이 null 이라 조별 뷰가 묶지 않는다. 목록에서 빼서
 * 눌렀는데 빈 화면이 나오는 일이 없게 한다.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { view: rawView, group: rawGroup } = await searchParams;
  const view: ChartView = pickChartView(rawView);

  const people = await listPeople();
  const groups = collectGroupNames(people).filter(
    (name) => name !== UNASSIGNED_GROUP_LABEL,
  );

  // 없는 조 이름이 쿼리로 들어오면 전체로 되돌린다
  const group =
    rawGroup !== undefined && groups.includes(rawGroup) ? rawGroup : ALL_GROUPS;

  const isAll = group === ALL_GROUPS;
  const [overall, groupRows, byGroup] = await Promise.all([
    getOverallStrengthRatio(),
    isAll ? Promise.resolve(null) : getGroupStrengthRatio(group),
    isAll && groups.length > 1 ? getAllGroupStrengthRatios() : Promise.resolve(null),
  ]);
  const strengthRows = groupRows ?? overall;

  // 조 차례는 명단의 자연 정렬을 따른다. 받은 것이 없는 조는 groupProfiles 가 뺀다
  const profiles =
    byGroup === null
      ? []
      : groupProfiles(
          new Map(groups.map((name) => [name, byGroup.get(name) ?? []])),
          overall,
        );
  const hasData = strengthRows.length > 0;
  const hidden = hiddenStrengths(strengthRows);

  const links: SectionLink[] = [
    { id: "chart", label: "한눈에" },
    ...(profiles.length > 0 ? [{ id: "groups", label: "조마다의 결" }] : []),
    ...(hasData ? [{ id: "hidden", label: "아직 숨은 강점" }] : []),
    { id: "more", label: "나에 대해 더 보기" },
  ];

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

      <h1 className="mt-4 text-2xl">모두의 강점</h1>
      <p className="mt-1 text-sm text-muted">
        {group === ALL_GROUPS
          ? "모두가 받은 강점"
          : `${group}${josa(group, "이/가")} 받은 강점`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href="/results/report" download className={buttonClass("primary", false, "md")}>
          전체 결과 PDF로 받기
        </a>
        <p className="text-sm text-muted">조마다의 결, 한 사람 한 사람의 강점까지 담겨요</p>
      </div>

      <div className="mt-4">
        <SectionNav links={links} />
      </div>

      <div id="chart" className="mt-4 scroll-mt-6">
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

      {profiles.length > 0 && (
        <InsightSection
          id="groups"
          title="조마다의 결"
          description="누가 더 많이가 아니라, 조마다 어떤 색인지 나란히 놓았어요. 누르면 그 조만 볼 수 있어요."
        >
          <GroupProfiles profiles={profiles} hrefFor={(name) => hrefFor(view, name)} />
        </InsightSection>
      )}

      {hasData && (
        <InsightSection
          id="hidden"
          title="아직 숨은 강점"
          description={
            isAll
              ? "우리 모임에서 아직 잘 보이지 않은 강점이에요. 다음엔 이런 모습도 찾아보면 어떨까요."
              : `${group}에서 아직 잘 보이지 않은 강점이에요.`
          }
        >
          <HiddenStrengths hidden={hidden} />
        </InsightSection>
      )}

      <InsightSection id="more" title="나에 대해 더 보기">
        <ExploreCards people={people} omit="results" showHeading={false} />
      </InsightSection>
    </main>
  );
}
