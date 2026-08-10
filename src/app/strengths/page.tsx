import type { Metadata } from "next";
import Link from "next/link";

import { StrengthBody } from "@/features/strengths/StrengthBody";
import { STRENGTHS_BY_VIRTUE } from "@/lib/strengths";

export const metadata: Metadata = {
  title: "24가지 강점 · 강점 남기기",
};

/**
 * 24가지 강점을 한자리에서 읽는 화면.
 *
 * 고르는 중에는 시트로 하나씩 보지만, 미리 훑어보고 싶은 사람도 있다.
 * 설명 본문은 시트와 같은 컴포넌트를 쓴다. 두 벌로 두면 문구가 갈라진다.
 */
export default function StrengthsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="inline-block min-h-11 py-3 text-sm text-muted underline underline-offset-4"
      >
        명단으로
      </Link>

      <h1 className="mt-2 text-2xl">24가지 강점</h1>
      <p className="mt-2 text-sm text-muted">
        여섯 덕목으로 묶여 있어요. 무엇을 고를지 헷갈릴 때 읽어보세요.
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
