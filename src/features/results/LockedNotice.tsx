import Link from "next/link";

import { buttonClass } from "@/components/Button";
import { MIN_STRENGTHS_PER_PERSON } from "@/lib/constants";

/**
 * 결과 공개 게이트가 잠겨 있을 때 (4장).
 *
 * 한 명이라도 5개를 못 채우면 누구의 결과도 열리지 않는다.
 * 남은 사람 수만 알려준다. 누가 남았는지·누가 몇 개 받았는지는
 * 서버가 애초에 내려주지 않는다. 그걸 알려주면 "아직 아무도 안 써준 사람"
 * 이 누구인지 방 안 모두가 알게 된다.
 */
export function LockedNotice({ remaining }: { remaining: number }) {
  return (
    <div className="rounded-base border border-line bg-surface px-4 py-10 text-center">
      <p className="font-display text-base">아직 열리지 않았어요</p>
      <p className="num mt-2 text-sm text-muted">
        {remaining > 0
          ? `${remaining}명이 강점 ${MIN_STRENGTHS_PER_PERSON}개를 채우면 모두의 결과가 함께 열려요`
          : `모두가 강점 ${MIN_STRENGTHS_PER_PERSON}개씩 받으면 결과가 함께 열려요`}
      </p>
      <div className="mt-4">
        {/* 잠긴 화면에서 할 수 있는 유일한 일 */}
        <Link href="/" className={buttonClass("primary", false, "lg")}>
          강점 남기러 가기
        </Link>
      </div>
    </div>
  );
}
