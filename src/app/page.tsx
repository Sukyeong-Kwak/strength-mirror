import Link from "next/link";

import { PeopleBrowser } from "@/features/home/PeopleBrowser";
import { listPeople } from "@/lib/data/people";

export default async function HomePage() {
  const people = await listPeople();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl">강점 남기기</h1>
      <p className="mt-2 text-sm text-muted">
        이름을 골라 그 사람에게서 본 강점을 남겨주세요.
      </p>

      <div className="mt-6">
        <PeopleBrowser people={people} />
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <Link
          href="/strengths"
          className="inline-block min-h-11 py-3 text-sm text-muted underline underline-offset-4"
        >
          24가지 강점이 무엇인지 보기
        </Link>
      </div>
    </main>
  );
}
