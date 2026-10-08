import Link from "next/link";

import { buttonClass } from "@/components/Button";

/**
 * 사이트 첫 주소.
 *
 * 참여는 그룹마다 따로 받은 링크(/e/<slug>)로 한다. 여기서 그룹 목록을 보여주지 않는다 —
 * 다른 회사 · 모임의 이름이 서로 보이지 않게 하려는 것이다.
 * 링크 없이 들어온 사람에게는 무엇을 하는 곳인지와 링크를 받아오라는 말만 한다.
 */
export default function SiteHomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl">강점 발굴</h1>
      <p className="mt-3 max-w-prose">
        하나님께서 서로에게 주신 강점을 발견해 남기고, 모아서 보는 곳이에요.
      </p>
      <p className="mt-4 max-w-prose rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
        참여 화면은 모임마다 따로 있어요. 진행자에게 받은 링크로 들어와 주세요.
      </p>

      <div className="mt-8">
        <Link href="/strengths" className={buttonClass("secondary", false, "sm")}>
          24가지 강점 보기
        </Link>
      </div>
    </main>
  );
}
