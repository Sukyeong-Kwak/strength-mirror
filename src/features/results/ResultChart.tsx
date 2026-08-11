import Link from "next/link";

import { RatioBar, VirtueStack } from "@/components/RatioBar";
import { buttonClass } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { groupByVirtue, splitByVisibility, toVirtueSegments } from "@/lib/ratio";
import type { ChartView, StrengthRatioRow } from "@/types/domain";

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

export function ViewToggle({
  view,
  hrefFor,
}: {
  view: ChartView;
  /** 보기별 링크. 화면마다 다른 쿼리를 붙여야 해서 밖에서 만든다 */
  hrefFor: (view: ChartView) => string;
}) {
  const items: readonly { key: ChartView; label: string }[] = [
    { key: "strength", label: "강점별" },
    { key: "virtue", label: "덕목별" },
  ];

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={hrefFor(item.key)}
          aria-current={item.key === view ? "page" : undefined}
          /* 이 화면을 보는 방식을 정하는 자리다. 아래 조 거르기(sm)보다 먼저 읽혀야 한다 */
          className={buttonClass(item.key === view ? "primary" : "secondary", false, "md")}
        >
          {item.label}
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

  const { charted, mentioned } = splitByVisibility(strengthRows);

  if (view === "virtue") {
    /*
      덕목 값은 강점 비율을 더해서 만든다. DB 의 덕목 뷰(person_virtue_ratio 등)를
      쓰지 않는 이유는 그쪽이 자기 나름대로 5% 눈금에 올리기 때문이다.
      같은 인간애가 이 화면에서 40%, 강점별 보기의 소계에서 35% 로 갈리면
      숫자를 믿을 수 없게 된다. 출처를 하나로 둔다 (ratio.ts 의 groupByVirtue 주석).
    */
    const groups = groupByVirtue(strengthRows);
    const segments = toVirtueSegments(
      groups.map((group) => ({ virtue: group.virtue, ratio: group.subtotal })),
    );

    return (
      <div>
        <VirtueStack rows={segments} />

        <ul className="mt-4 flex flex-col gap-4">
          {groups
            .filter((group) => group.subtotal > 0)
            .map((group, index) => (
              <RatioBar
                key={group.virtue}
                nameKo={group.meta.nameKo}
                ratio={group.subtotal}
                virtue={group.virtue}
                index={index}
              />
            ))}
        </ul>

        <MentionedStrengths rows={mentioned} />
      </div>
    );
  }

  const groups = groupByVirtue(strengthRows).filter(
    (group) => group.rows.some((row) => row.ratio > 0),
  );

  // 막대가 자라는 차례는 화면에 보이는 순서를 따른다. 섹션이 바뀌어도 이어 센다
  let barIndex = 0;

  return (
    <div>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.virtue}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className={`text-sm ${group.meta.textClass}`}>{group.meta.nameKo}</h2>
              <span className="num text-sm text-muted">{group.subtotal}%</span>
            </div>

            <ul className="mt-2 flex flex-col gap-3">
              {group.rows
                .filter((row) => row.ratio > 0)
                .map((row) => (
                  <RatioBar
                    key={row.strengthCode}
                    nameKo={row.nameKo}
                    ratio={row.ratio}
                    virtue={row.virtue}
                    index={barIndex++}
                  />
                ))}
            </ul>
          </section>
        ))}
      </div>

      {charted.length === 0 && (
        <EmptyState title="받은 강점이 모두 5% 아래예요. 아래 이름으로 확인해주세요" />
      )}

      <MentionedStrengths rows={mentioned} />
    </div>
  );
}
