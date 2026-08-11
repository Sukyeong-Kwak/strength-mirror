import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClass } from "@/components/Button";
import { StrengthBody } from "@/features/strengths/StrengthBody";
import { findStrength, STRENGTHS } from "@/lib/strengths";

type StrengthPageProps = {
  params: Promise<{ code: string }>;
};

/** 24개뿐이고 내용이 상수라 전부 미리 만들어 둔다 */
export function generateStaticParams() {
  return STRENGTHS.map((strength) => ({ code: strength.code }));
}

export async function generateMetadata({
  params,
}: StrengthPageProps): Promise<Metadata> {
  const { code } = await params;
  const strength = findStrength(code);
  return {
    title:
      strength === null ? "강점 발굴" : `${strength.nameKo} · 24가지 강점`,
  };
}

/**
 * 강점 하나만 읽는 화면.
 *
 * 목차에서 카드를 누르면 여기로 온다. 궁금한 하나만 보고 돌아가는 길이라
 * 맨 위에 목차로 돌아가는 버튼을 둔다.
 */
export default async function StrengthPage({ params }: StrengthPageProps) {
  const { code } = await params;
  const strength = findStrength(code);
  if (strength === null) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/strengths" className={buttonClass("secondary", false, "sm")}>
        24가지 강점 목차
      </Link>

      {/* 덕목은 아래 설명 상자의 칩이 보여준다. 여기서 또 적으면 두 번 읽힌다 */}
      <h1 className="mt-4 text-2xl">{strength.nameKo}</h1>
      <p className="mt-2 text-base text-muted">{strength.short}</p>

      <div className="mt-6 rounded-base border border-line bg-surface p-5">
        <StrengthBody strength={strength} />
      </div>
    </main>
  );
}
