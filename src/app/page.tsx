import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { PeopleBrowser } from "@/features/home/PeopleBrowser";
import { listPeople } from "@/lib/data/people";

export default async function HomePage() {
  const people = await listPeople();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl">강점 발굴</h1>
      <p className="mt-2 text-sm text-muted">
        이름을 골라 그 사람에게서 본 강점을 남겨주세요.
      </p>

      <div className="mt-6">
        <PeopleBrowser people={people} />
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
        <Link href="/strengths" className={buttonClass()}>
          24가지 강점이 무엇인지 보기
        </Link>
        <Link href="/results" className={buttonClass()}>
          전체 집계 보기
        </Link>
      </div>
    </main>
  );
}
