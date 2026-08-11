import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { PeopleBrowser } from "@/features/home/PeopleBrowser";
import { listPeople } from "@/lib/data/people";

/**
 * 처음 열리는 화면.
 *
 * 명단만 덜렁 있으면 처음 들어온 사람은 이게 무엇을 하는 곳인지 모른 채
 * 남의 이름부터 누르게 된다. 그래서 명단 위에 이 자리가 원래 무엇이었는지
 * (큰 판에 붙이는 강점 스티커) 와 왜 하는지를 먼저 둔다.
 *
 * 다만 여기는 읽는 화면이 아니라 고르는 화면이다. 설명은 판을 떠올릴 만큼만
 * 쓰고, 강점 스물넷의 뜻풀이는 /strengths 로 넘긴다.
 */
export default async function HomePage() {
  const people = await listPeople();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl">강점 발굴</h1>

      {/* 설명 글줄은 격자를 따라 늘리지 않는다. 넓은 화면에서 한 줄이 길면 안 읽힌다 */}
      <div className="mt-3 max-w-prose">
        <p>
          큰 판에 서로의 이름을 적어두고, 그 사람에게 가장 잘 보이는 강점 스티커를
          붙여주는 시간이에요. 이 화면이 그 판을 대신해요.
        </p>

        <ul className="mt-4 flex flex-col gap-2 border-l-2 border-line pl-4 text-sm text-muted">
          <li>내가 몰랐던 내 강점을, 곁에서 지켜본 사람의 눈으로 알게 돼요.</li>
          <li>강점을 적어주는 일 자체가 서로를 격려하는 시간이 돼요.</li>
          <li>
            서로 다른 강점을 가진 우리가 모여 하나의 공동체, 하나의 퍼즐이 돼요.
          </li>
        </ul>

        <p className="mt-4 text-sm text-muted">
          이름을 골라 그 사람에게서 본 강점을 남겨주세요.
        </p>
      </div>

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
