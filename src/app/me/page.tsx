import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { LensView } from "@/features/insights/LensView";
import { listPeople } from "@/lib/data/people";

export const metadata: Metadata = {
  title: "내가 사람을 보는 눈",
  robots: { index: false, follow: false },
};

/**
 * 내가 사람을 보는 눈.
 *
 * 받은 강점이 "남이 본 나" 라면, 남긴 강점은 "내가 남을 볼 때 쓰는 눈" 이다.
 * 이 기기의 기록만 쓰므로 서버 조회가 없다.
 */
export default async function LensPage() {
  const people = await listPeople();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/" className={buttonClass("secondary", false, "sm")}>
        명단으로
      </Link>

      <h1 className="mt-4 text-2xl">내가 사람을 보는 눈</h1>
      <p className="mt-1 text-sm text-muted">
        내가 남긴 강점을 모아 보면, 내가 사람들에게서 주로 무엇을 보는지 드러나요.
      </p>

      <div className="mt-6">
        <LensView personIds={people.map((person) => person.id)} />
      </div>
    </main>
  );
}
