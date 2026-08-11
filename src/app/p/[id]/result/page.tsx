import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClass } from "@/components/Button";
import { ResultChart, ViewToggle } from "@/features/results/ResultChart";
import { LockedNotice } from "@/features/results/LockedNotice";
import { getPerson } from "@/lib/data/people";
import {
  getPersonReasons,
  getPersonStrengthRatio,
  getResultsStatus,
} from "@/lib/data/results";
import { toGroupLabel } from "@/lib/groups";
import { findStrength } from "@/lib/strengths";
import { formatRelativeTime } from "@/lib/time";
import { isChartView, type ChartView } from "@/types/domain";

type ResultPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
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
 * 게이트가 잠겨 있으면 뷰가 행을 아예 내려주지 않는다.
 * 여기서 unlocked 를 보는 것은 "왜 비어 있는지" 를 설명하기 위해서다.
 */
export default async function PersonResultPage({
  params,
  searchParams,
}: ResultPageProps) {
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const person = await getPerson(id);
  if (person === null) {
    notFound();
  }

  const { view: rawView } = await searchParams;
  const view: ChartView = isChartView(rawView) ? rawView : "strength";

  const status = await getResultsStatus();

  if (!status.unlocked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Link href={`/p/${person.id}`} className={buttonClass("secondary", false, "sm")}>
          돌아가기
        </Link>
        <h1 className="mt-4 text-2xl">{person.name}님이 받은 강점</h1>
        <div className="mt-6">
          <LockedNotice remaining={status.remaining} />
        </div>
      </main>
    );
  }

  const [strengthRows, reasons] = await Promise.all([
    getPersonStrengthRatio(person.id),
    getPersonReasons(person.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href={`/p/${person.id}`} className={buttonClass("secondary", false, "sm")}>
        돌아가기
      </Link>

      <h1 className="mt-4 text-2xl">{person.name}님이 받은 강점</h1>
      <p className="mt-1 text-sm text-muted">{toGroupLabel(person.groupName)}</p>

      <div className="mt-4">
        <ViewToggle
          view={view}
          hrefFor={(next) => `/p/${person.id}/result?view=${next}`}
        />
      </div>

      {/* 비율만 보여준다. 몇 명이 골랐는지는 서버에서 오지 않는다 */}
      <div className="mt-6">
        <ResultChart view={view} strengthRows={strengthRows} />
      </div>

      {reasons.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm text-muted">남겨준 이야기</h2>
          <ul className="mt-2 flex flex-col gap-3">
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
                    {entry.authorName ?? "익명"}
                    {entry.createdAt !== "" &&
                      ` · ${formatRelativeTime(entry.createdAt)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
