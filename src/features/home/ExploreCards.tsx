import Link from "next/link";

type ExploreCardsProps = {
  /** 지금 있는 화면의 칸은 뺀다. 모두의 강점 화면에서 모두의 강점으로 가는 칸은 군더더기다 */
  omit?: "results";
  /** 바깥에 이미 제목이 있으면 끈다 */
  showHeading?: boolean;
};

const CARD =
  "flex h-full flex-col rounded-base border border-line bg-surface px-4 py-4 text-left";

/**
 * 둘러보기 — 남기는 것 말고 볼 수 있는 것들.
 *
 * 볼거리를 작은 링크 하나에 묻어두면 있는 줄도 모르고 지나간다.
 * 보고 안 누르는 것은 괜찮지만 몰라서 못 누르면 안 된다.
 * 그래서 명단 위에 칸으로 펼치고, 칸마다 안에 무엇이 있는지 한 줄씩 적는다.
 *
 * 로그인이 없으므로 '나' 를 따로 기억하지 않는다. 내 결과는 명단에서 내 이름을 눌러 본다.
 */
export function ExploreCards({ omit, showHeading = true }: ExploreCardsProps) {
  return (
    <section aria-label="둘러보기">
      {showHeading && <h2 className="mb-2 text-sm text-muted">둘러보기</h2>}
      <ul className={`grid gap-2 ${omit === undefined ? "sm:grid-cols-2" : ""}`}>
        <li>
          <Link href="/#people" className={CARD}>
            <span className="font-display text-lg">내 강점</span>
            <span className="mt-1 block text-sm text-muted">
              명단에서 내 이름을 누르면 강점 카드, 유독 많이 보인 강점, 결이 비슷한 사람까지
              보고 PDF로 받을 수 있어요
            </span>
          </Link>
        </li>

        {omit !== "results" && (
          <li>
            <Link href="/results" className={CARD}>
              <span className="font-display text-lg">모두의 강점</span>
              <span className="mt-1 block text-sm text-muted">
                우리 모임의 결 · 조마다의 색 · 아직 숨은 강점 · PDF로 받기
              </span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
