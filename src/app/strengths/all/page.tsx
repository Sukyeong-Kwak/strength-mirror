import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { StrengthBody } from "@/features/strengths/StrengthBody";
import { STRENGTHS_BY_VIRTUE } from "@/lib/strengths";

export const metadata: Metadata = {
  title: "전체 한눈에 보기 · 강점 발굴",
};

/**
 * 24가지를 이어서 읽는 화면.
 *
 * 목차(/strengths)가 기본이고 이쪽은 통독용이다.
 * 고르기 전에 전부 훑어보고 싶은 사람이 있고, 그 사람에게는
 * 스물네 번 눌러 들어갔다 나오는 것이 목차보다 불편하다.
 *
 * 설명 본문은 시트·상세와 같은 컴포넌트를 쓴다. 두 벌로 두면 문구가 갈라진다.
 */
export default function AllStrengthsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/strengths" className={buttonClass("secondary", false, "sm")}>
        24가지 강점 목차
      </Link>

      <h1 className="mt-4 text-2xl">전체 한눈에 보기</h1>
      <p className="mt-2 text-sm text-muted">
        여섯 덕목 순서대로 스물네 가지를 모두 실었어요.
      </p>

      <div className="mt-8 flex flex-col gap-10">
        {STRENGTHS_BY_VIRTUE.map(({ virtue, meta, strengths }) => (
          <section key={virtue}>
            <h2 className={`text-sm ${meta.textClass}`}>{meta.nameKo}</h2>

            <div className="mt-3 flex flex-col gap-4">
              {strengths.map((strength) => (
                <article
                  key={strength.code}
                  className="rounded-base border border-line bg-surface p-5"
                >
                  <h3 className="font-display text-lg">{strength.nameKo}</h3>
                  <div className="mt-2">
                    <StrengthBody strength={strength} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
