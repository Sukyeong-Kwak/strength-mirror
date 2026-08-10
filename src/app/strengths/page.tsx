import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { STRENGTHS_BY_VIRTUE } from "@/lib/strengths";

export const metadata: Metadata = {
  title: "24가지 강점 · 강점 발굴",
};

/**
 * 24가지 강점 목차.
 *
 * 설명을 통째로 늘어놓지 않고 이름만 카드로 깐다.
 * 24개를 처음 만나는 사람에게 필요한 것은 읽을 거리가 아니라 지도다.
 * 덕목으로 묶어 여섯 덩어리로 보이면 스물넷이 여섯으로 줄어든다.
 *
 * 자세히 읽는 길은 두 개다.
 *   카드 → 그 강점 하나만 (/strengths/[code])
 *   전체 한눈에 보기 → 스물넷을 이어서 (/strengths/all)
 */
export default function StrengthsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/" className={buttonClass()}>
        명단으로
      </Link>

      <h1 className="mt-4 text-2xl">24가지 강점</h1>
      <p className="mt-2 text-sm text-muted">
        여섯 덕목으로 묶여 있어요. 궁금한 강점을 눌러보세요.
      </p>

      <div className="mt-4">
        <Link href="/strengths/all" className={buttonClass()}>
          전체 한눈에 보기
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {STRENGTHS_BY_VIRTUE.map(({ virtue, meta, strengths }) => (
          <section key={virtue}>
            <h2 className={`text-sm ${meta.textClass}`}>{meta.nameKo}</h2>

            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {strengths.map((strength) => (
                <li key={strength.code}>
                  <Link
                    href={`/strengths/${strength.code}`}
                    className="block rounded-base border border-line bg-surface p-4"
                  >
                    <span className="font-display text-base">{strength.nameKo}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {strength.short}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
