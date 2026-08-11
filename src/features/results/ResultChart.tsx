import Link from "next/link";

import { RatioBar, VirtueDonut } from "@/components/RatioBar";
import { buttonClass } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StrengthHeatmap } from "@/features/results/StrengthHeatmap";
import { groupByVirtue, splitByVisibility, toVirtueSegments } from "@/lib/ratio";
import { getStrength } from "@/lib/strengths";
import { CHART_VIEWS, type ChartView, type StrengthRatioRow } from "@/types/domain";

/**
 * 집계 차트 (7-1 · 7-2).
 *
 * 개인 결과와 전체 통계가 같은 차트를 쓴다. 두 벌로 두면 눈금이 갈라진다.
 *
 * 보기 전환은 URL 쿼리(`?view=`)로 한다. 클라이언트 상태로 두면
 * 새로 고침이나 공유 링크에서 보던 화면이 사라지고, 이 화면은 서버가
 * 그린 그대로 끝나므로 상태를 들고 있을 이유가 없다.
 *
 * 서버에서 내려오는 것은 비율뿐이다. 건수는 어떤 경로로도 오지 않는다.
 */

/**
 * 탭 이름은 명사 하나로 둔다.
 *
 * 전에는 "한눈에 · 강점별 · 덕목별" 이었다. 첫 칸만 부사구고 나머지는
 * "…별" 이라 나란히 놓았을 때 형태가 어긋났다. 한 줄에 붙어 있는 것들은
 * 품사가 같아야 눈이 훑고 지나간다.
 *
 * 두 번째 칸을 "순위" 로 부르는 것은, 히트맵이 못 해주는 일이 그것뿐이기
 * 때문이다. 넓이로는 두 칸 중 어느 쪽이 큰지는 보여도 몇 번째인지는 셀 수
 * 없다. "목록" 은 무엇이 담겼는지를 말해주지 않아 고를 근거가 되지 못한다.
 */
const VIEW_LABEL: Record<ChartView, string> = {
  heatmap: "히트맵",
  ranking: "순위",
};

export function ViewToggle({
  view,
  hrefFor,
}: {
  view: ChartView;
  /** 보기별 링크. 화면마다 다른 쿼리를 붙여야 해서 밖에서 만든다 */
  hrefFor: (view: ChartView) => string;
}) {
  return (
    <div className="flex gap-2">
      {CHART_VIEWS.map((key) => (
        <Link
          key={key}
          href={hrefFor(key)}
          aria-current={key === view ? "page" : undefined}
          /* 이 화면을 보는 방식을 정하는 자리다. 아래 조 거르기(sm)보다 먼저 읽혀야 한다 */
          className={buttonClass(key === view ? "primary" : "secondary", false, "md")}
        >
          {VIEW_LABEL[key]}
        </Link>
      ))}
    </div>
  );
}

/** 5% 에 못 미쳐 막대가 사라진 강점들. 이름만 모아 남긴다 (7-1) */
function MentionedStrengths({ rows }: { rows: readonly StrengthRatioRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-base border border-line bg-surface px-4 py-3">
      <p className="text-sm text-muted">이런 강점도 받았어요</p>
      <p className="mt-1 text-base">
        {rows.map((row) => row.nameKo).join(" · ")}
      </p>
    </div>
  );
}

export function ResultChart({
  view,
  strengthRows,
}: {
  view: ChartView;
  strengthRows: readonly StrengthRatioRow[];
}) {
  if (strengthRows.length === 0) {
    return <EmptyState title="아직 집계할 것이 없어요" />;
  }

  const { mentioned } = splitByVisibility(strengthRows);

  if (view === "heatmap") {
    /*
      히트맵은 스물네 칸을 다 그리므로 "이런 강점도 받았어요" 를 붙이지 않는다.
      5% 아래로 내려간 강점도 판 위에 옅은 칸으로 이미 자리를 갖고 있다.
    */
    return <StrengthHeatmap strengthRows={strengthRows} />;
  }

  /*
    위는 덕목 도넛, 아래는 강점 하나하나. 두 층이 한 화면에 있다.

    전에는 이 둘이 탭 두 개였다. 나눠 두면 "우리는 인간애 쪽" 과
    "그중 친절이 가장 많다" 사이를 오가느라 탭을 계속 누르게 된다.
    사실 그 둘은 같은 이야기의 큰 단위와 작은 단위다. 위아래로 놓으면
    눈이 한 번 내려가는 것으로 끝난다.

    강점은 덕목으로 갈라 섹션을 만들지 않는다. 머리글과 섹션 사이 여백이
    막대보다 많은 자리를 차지했고, 무엇보다 섹션이 다르면 막대가 서로 다른
    세로선에서 시작해 친절과 감사를 나란히 견줄 수 없었다.
    어느 덕목인지는 막대 색과 위 도넛 범례가 알려준다.

    덕목 값은 강점 비율을 더해서 만든다. DB 의 덕목 뷰(overall_virtue_ratio 등)를
    쓰지 않는 이유는 그쪽이 자기 나름대로 5% 눈금에 올리기 때문이다.
    같은 인간애가 도넛에서 40%, 아래 막대들의 합에서 35% 로 갈리면
    숫자를 믿을 수 없게 된다. 출처를 하나로 둔다 (ratio.ts 의 groupByVirtue 주석).
  */
  const segments = toVirtueSegments(
    groupByVirtue(strengthRows).map((group) => ({
      virtue: group.virtue,
      ratio: group.subtotal,
    })),
  );

  /*
    같은 비율이 여럿일 때 VIA 표의 차례로 갈라 세운다. 서버 뷰에는 ORDER BY 가
    없어서, 비율만으로 세우면 10% 짜리 여섯 개가 새로 고칠 때마다 자리를 바꾼다.
  */
  const ranked = strengthRows
    .filter((row) => row.ratio > 0)
    .sort((a, b) =>
      b.ratio === a.ratio
        ? getStrength(a.strengthCode).order - getStrength(b.strengthCode).order
        : b.ratio - a.ratio,
    );

  return (
    <div>
      <VirtueDonut rows={segments} />

      {ranked.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="받은 강점이 모두 5% 아래예요. 아래 이름으로 확인해주세요" />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-6">
          {ranked.map((row, index) => (
            <RatioBar
              key={row.strengthCode}
              nameKo={row.nameKo}
              ratio={row.ratio}
              virtue={row.virtue}
              index={index}
              /* 1등이 막대 끝까지 간다. ranked 는 이미 큰 순이라 첫 줄이 1등이다 */
              max={ranked[0]?.ratio ?? 100}
            />
          ))}
        </ul>
      )}

      <MentionedStrengths rows={mentioned} />
    </div>
  );
}
