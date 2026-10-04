import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClass } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { DistinctiveList } from "@/features/insights/DistinctiveList";
import { MeToggle } from "@/features/insights/MeToggle";
import { PeopleMatches, type MatchEntry } from "@/features/insights/PeopleMatches";
import { ReportDownload } from "@/features/insights/ReportDownload";
import { InsightSection, SectionNav, type SectionLink } from "@/features/insights/SectionNav";
import { SentByMe } from "@/features/insights/SentByMe";
import { StrengthCard } from "@/features/insights/StrengthCard";
import { ResultChart } from "@/features/results/ResultChart";
import { getPerson, listPeople } from "@/lib/data/people";
import {
  getAllPersonStrengthRatios,
  getOverallStrengthRatio,
  getPersonReasons,
} from "@/lib/data/results";
import { toGroupLabel } from "@/lib/groups";
import {
  complementPeople,
  distinctiveStrengths,
  pickQuote,
  similarPeople,
  topStrengths,
} from "@/lib/insights";
import { findStrength } from "@/lib/strengths";
import { formatRelativeTime } from "@/lib/time";
type ResultPageProps = {
  params: Promise<{ id: string }>;
};

/** 이름이 브라우저 기록과 공유 미리보기에 남지 않게 한다 */
export const metadata: Metadata = {
  title: "받은 강점",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 개인 결과 (12단계).
 *
 * 누구의 결과든 언제든 볼 수 있다.
 * 남긴 사람은 모두 익명이다. 서버가 이름을 애초에 내려주지 않는다.
 */
export default async function PersonResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const person = await getPerson(id);
  if (person === null) {
    notFound();
  }

  const [allRatios, overall, reasons, people] = await Promise.all([
    getAllPersonStrengthRatios(),
    getOverallStrengthRatio(),
    getPersonReasons(person.id),
    listPeople(),
  ]);
  const strengthRows = allRatios.get(person.id) ?? [];
  const subject = `${person.name}님`;

  const top = topStrengths(strengthRows, 3).map((row) => ({
    code: row.strengthCode,
    ratio: row.ratio,
    quote: pickQuote(reasons, row.strengthCode),
  }));
  const distinctive = distinctiveStrengths(strengthRows, overall, 3);

  // 숨긴 사람은 비율 뷰에서 이미 빠지지만, 이름을 붙일 수 없는 id 는 한 번 더 거른다
  const byId = new Map(people.map((p) => [p.id, p]));
  const toEntry = (personId: string, strengths: MatchEntry["strengths"]): MatchEntry[] => {
    const found = byId.get(personId);
    return found === undefined
      ? []
      : [{ personId, name: found.name, groupLabel: toGroupLabel(found.groupName), strengths }];
  };
  const similarRaw = similarPeople(person.id, allRatios, 2);
  const similar = similarRaw.flatMap((s) => toEntry(s.personId, s.shared));
  const complement = complementPeople(
    person.id,
    allRatios,
    new Set(similarRaw.map((s) => s.personId)),
    2,
  ).flatMap((c) => toEntry(c.personId, c.brings));

  const hasData = strengthRows.length > 0;
  const links: SectionLink[] = [
    ...(hasData ? [{ id: "card", label: "강점 카드" }] : []),
    ...(distinctive.length > 0 ? [{ id: "distinctive", label: "유독 많이 보인 강점" }] : []),
    ...(hasData ? [{ id: "ranking", label: "받은 강점 전체" }] : []),
    ...(similar.length + complement.length > 0
      ? [{ id: "matches", label: similar.length > 0 ? "결이 비슷한 사람" : "서로 채워주는 사람" }]
      : []),
    ...(reasons.length > 0 ? [{ id: "stories", label: "남겨준 이야기" }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href={`/p/${person.id}`} className={buttonClass("secondary", false, "sm")}>
        돌아가기
      </Link>

      <h1 className="mt-4 text-2xl">{person.name}님이 받은 강점</h1>
      <p className="mt-1 text-sm text-muted">{toGroupLabel(person.groupName)}</p>

      <div className="mt-3">
        <MeToggle personId={person.id} />
      </div>

      {/* 이 화면의 모든 것을 한 파일로. 간직할 수 있는 결과물이라 눈에 띄게 둔다 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ReportDownload personId={person.id} name={person.name} />
        <p className="text-sm text-muted">
          이 화면의 모든 내용을 PDF 파일로 간직할 수 있어요
        </p>
      </div>

      <div className="mt-5">
        <SectionNav links={links} />
      </div>

      {hasData && (
        <section id="card" className="mt-6 scroll-mt-6">
          <StrengthCard
            name={person.name}
            groupLabel={toGroupLabel(person.groupName)}
            top={top}
            distinctive={distinctive[0]?.code ?? null}
          />
          <div className="mt-3">
            <Link
              href={`/p/${person.id}/card`}
              className={buttonClass("secondary", false, "sm")}
            >
              카드 크게 보기 · 링크 보내기
            </Link>
          </div>
        </section>
      )}

      {distinctive.length > 0 && (
        <InsightSection
          id="distinctive"
          title="유독 많이 보인 강점"
          description={`많이 받은 순이 아니라, 모두가 받은 것과 견줘 ${subject}에게서 특히 더 보인 강점이에요.`}
        >
          <DistinctiveList subject={subject} items={distinctive} />
        </InsightSection>
      )}

      {/*
        여기에는 탭이 없다. 히트맵은 전체 집계에서만 뜻이 있다 — 한 사람이 받는
        강점은 대여섯 가지라 스물네 칸 중 스무 칸이 빈 판이 되고, 그 판은
        받은 것보다 못 받은 것을 먼저 보여준다.

        비율만 보여준다. 몇 명이 골랐는지는 서버에서 오지 않는다
      */}
      {hasData ? (
        <InsightSection id="ranking" title="받은 강점 전체">
          <ResultChart view="ranking" strengthRows={strengthRows} />
        </InsightSection>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={`아직 ${subject}에게 남겨진 강점이 없어요. 떠오르는 게 있다면 첫 번째로 남겨보세요`}
            action={
              <Link href={`/p/${person.id}`} className={buttonClass("primary", false, "md")}>
                강점 남기러 가기
              </Link>
            }
          />
        </div>
      )}

      {similar.length + complement.length > 0 && (
        <InsightSection id="matches" title="결이 비슷한 사람 · 서로 채워주는 사람">
          <PeopleMatches subject={subject} similar={similar} complement={complement} />
        </InsightSection>
      )}

      <SentByMe
        personId={person.id}
        people={people.map((p) => ({
          id: p.id,
          name: p.name,
          groupLabel: toGroupLabel(p.groupName),
        }))}
      />

      {reasons.length > 0 && (
        <InsightSection id="stories" title="남겨준 이야기">
          <ul className="flex flex-col gap-3">
            {reasons.map((entry, index) => {
              const strength = findStrength(entry.strengthCode);
              return (
                <li
                  key={`${entry.strengthCode}-${entry.createdAt}-${index}`}
                  className="rounded-base border border-line bg-surface px-4 py-3"
                >
                  <p className="font-display text-base">
                    {strength?.nameKo ?? entry.strengthCode}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">
                    {entry.reason}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    익명
                    {entry.createdAt !== "" &&
                      ` · ${formatRelativeTime(entry.createdAt)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </InsightSection>
      )}
    </main>
  );
}
