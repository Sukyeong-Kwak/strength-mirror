import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClass } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ShareButton } from "@/features/insights/ShareButton";
import { StrengthCard } from "@/features/insights/StrengthCard";
import { getPerson } from "@/lib/data/people";
import {
  getOverallStrengthRatio,
  getPersonReasons,
  getPersonStrengthRatio,
} from "@/lib/data/results";
import { toGroupLabel } from "@/lib/groups";
import { distinctiveStrengths, pickQuote, topStrengths } from "@/lib/insights";

type CardPageProps = {
  params: Promise<{ id: string }>;
};

/** 이름이 공유 미리보기에 남지 않게 한다. 링크를 받은 사람은 열어서 본다 */
export const metadata: Metadata = {
  title: "강점 카드",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 강점 카드 크게 보기.
 *
 * 캡처해서 간직하거나 링크로 보내기 좋게 카드 하나만 크게 둔다.
 * 결과 화면의 요약 카드와 같은 컴포넌트다.
 */
export default async function StrengthCardPage({ params }: CardPageProps) {
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const person = await getPerson(id);
  if (person === null) {
    notFound();
  }

  const [rows, overall, reasons] = await Promise.all([
    getPersonStrengthRatio(person.id),
    getOverallStrengthRatio(),
    getPersonReasons(person.id),
  ]);

  const top = topStrengths(rows, 3).map((row) => ({
    code: row.strengthCode,
    ratio: row.ratio,
    quote: pickQuote(reasons, row.strengthCode),
  }));
  const distinctive = distinctiveStrengths(rows, overall, 1)[0]?.code ?? null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Link
        href={`/p/${person.id}/result`}
        className={buttonClass("secondary", false, "sm")}
      >
        결과 전체 보기
      </Link>

      <div className="mt-4">
        {top.length === 0 ? (
          <EmptyState
            title={`아직 ${person.name}님에게 남겨진 강점이 없어요. 첫 번째로 남겨보세요`}
            action={
              <Link href={`/p/${person.id}`} className={buttonClass("primary", false, "md")}>
                강점 남기러 가기
              </Link>
            }
          />
        ) : (
          <>
            <StrengthCard
              name={person.name}
              groupLabel={toGroupLabel(person.groupName)}
              top={top}
              distinctive={distinctive}
              size="large"
            />
            <div className="mt-4">
              <ShareButton title="강점 카드" />
            </div>
            <p className="mt-3 text-sm text-muted">
              화면을 캡처해 간직해도 좋아요. 이야기는 받은 것 중에서 한 줄씩 골랐어요.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
