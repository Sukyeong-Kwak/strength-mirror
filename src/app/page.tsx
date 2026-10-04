import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { ExploreCards } from "@/features/home/ExploreCards";
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
          큰 판에 서로의 이름을 적어두고, 그 사람에게 주신 강점을 찾아 스티커를
          붙여주던 그 놀이를 화면으로 옮겼어요.
        </p>

        <ul className="mt-4 flex flex-col gap-2 border-l-2 border-line pl-4 text-sm text-muted">
          <li>하나님께서 내게 주신 강점을, 곁에 있던 사람의 눈으로 발견하게 돼요.</li>
          <li>평소엔 쑥스러워 못 했던 칭찬을 조금 구체적으로 건네는 일이에요.</li>
          <li>모이고 나면 우리에게 어떤 강점들을 주셨는지 한눈에 보여요.</li>
        </ul>
      </div>

      {/*
        볼거리를 명단 위에 펼친다.
        전에는 "전체 집계 보기" 링크 하나였는데, 이름 하나를 고르고 떠나는 흐름이라
        그 아래에 무엇이 더 있는지 모르고 지나갔다. 보고 안 누르는 것은 괜찮지만
        몰라서 못 누르면 안 된다. 칸마다 안에 무엇이 있는지 한 줄씩 적는다.

        다만 이 화면에서 해야 할 일은 여전히 이름을 고르는 것이라
        칸의 글자는 명단의 이름보다 작게 둔다
      */}
      <div className="mt-6">
        <ExploreCards people={people} />
      </div>

      {/* 둘러보기의 '내 강점' 칸이 여기로 내려온다 */}
      {/*
        이 화면에서 해야 할 일은 이름을 고르는 것이다. 안내를 소개 끝이 아니라
        명단 바로 위에 두어 명단의 제목이 되게 한다. 소개와 둘러보기를 지나
        내려온 눈이 여기서 무엇을 할지 다시 붙잡는다
      */}
      <div id="people" className="mt-8 scroll-mt-6">
        <h2 className="text-lg">누구의 강점을 발견했나요?</h2>
        <p className="mt-1 mb-3 text-sm text-muted">
          떠오르는 사람부터, 생각나는 만큼만 남겨도 충분해요.
        </p>
        <PeopleBrowser people={people} />
      </div>

      {/*
        여기서 해야 할 일은 이름을 고르는 것이고, 이쪽은 곁길이다.
        같은 덩치로 두면 명단을 지나쳐 이쪽부터 누른다
      */}
      <div className="mt-10 border-t border-line pt-6">
        <Link href="/strengths" className={buttonClass("secondary", false, "sm")}>
          24가지 강점 보기
        </Link>
      </div>
    </main>
  );
}
