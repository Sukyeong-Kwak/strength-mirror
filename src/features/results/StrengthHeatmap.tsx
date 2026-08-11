import type { CSSProperties } from "react";

import { VirtueLegend } from "@/components/RatioBar";
import {
  HEATMAP_ASPECT,
  HEATMAP_NAME_MIN_AREA,
  HEATMAP_RATIO_MIN_AREA,
} from "@/lib/constants";
import { buildHeatmap, tintPercent, type HeatmapTile } from "@/lib/heatmap";
import type { Rect } from "@/lib/treemap";
import type { StrengthRatioRow } from "@/types/domain";

/**
 * 강점 히트맵 — 전체 집계의 첫 화면.
 *
 * 주식 히트맵처럼 읽는다. 큰 네모가 덕목이고 색이 곧 덕목이다.
 * 그 안의 작은 네모 24개가 강점이고, 넓이가 비율이다. 합은 100% 다.
 *
 * 자리 계산은 전부 lib/heatmap.ts 가 한다. 여기서는 나온 사각형을
 * 퍼센트로 얹기만 한다. 서버 컴포넌트라 자바스크립트 없이 그대로 그려진다.
 *
 * 칸이 작으면 글자가 들어가지 않는다. 그럴 때는 눈에만 안 보이게 두고
 * (sr-only) 읽는 프로그램에는 24개 이름과 퍼센트가 전부 그대로 간다.
 * 아래 덕목 범례는 색을 풀어주는 자리라 눈으로만 본다.
 */

/** 부모 안에서의 자리. 소수점을 길게 남겨봐야 HTML 만 커진다 */
function place(rect: Rect): CSSProperties {
  return {
    left: `${rect.x.toFixed(3)}%`,
    top: `${rect.y.toFixed(3)}%`,
    width: `${rect.w.toFixed(3)}%`,
    height: `${rect.h.toFixed(3)}%`,
  };
}

/**
 * 칸을 채우는 색.
 *
 * 받은 강점은 덕목 색을 비율만큼 진하게 섞는다. 아무도 고르지 않은 강점은
 * 색을 주지 않고 흰 칸으로 비워둔다. 옅은 색과 빈 칸이 같아 보이면
 * "적게 받았다" 와 "아직 아무도 안 골랐다" 가 한 덩어리가 된다.
 *
 * 글자는 언제나 본문 먹색이다. 흐린 글자색(muted)을 얹으면 진한 칸에서
 * 3.2:1 까지 떨어진다. 진하기 상한(75%)은 먹색 기준으로 잡은 값이다.
 */
function fill(tile: HeatmapTile, colorVar: string, maxRatio: number): CSSProperties {
  if (!tile.received) {
    return {
      backgroundColor: "var(--color-surface)",
      boxShadow: "inset 0 0 0 1px var(--color-line)",
    };
  }

  return {
    backgroundColor: `color-mix(in srgb, var(${colorVar}) ${tintPercent(tile.ratio, maxRatio)}%, white)`,
  };
}

export function StrengthHeatmap({
  strengthRows,
}: {
  strengthRows: readonly StrengthRatioRow[];
}) {
  const blocks = buildHeatmap(strengthRows);
  const maxRatio = Math.max(
    0,
    ...blocks.flatMap((block) => block.tiles.map((tile) => tile.ratio)),
  );

  return (
    <div>
      <p className="text-sm text-muted">
        칸 크기가 비율이에요. 색은 덕목이고, 스물네 칸을 합치면 100%예요.
      </p>

      <ul
        className="relative mt-3 w-full overflow-hidden rounded-base bg-page"
        style={{ aspectRatio: HEATMAP_ASPECT }}
      >
        {blocks.map((block) => (
          /* 덕목끼리는 6px, 같은 덕목 안의 강점끼리는 2px 떨어진다.
             간격 차이가 "이 넷은 한 덩어리" 라고 말해준다 */
          <li key={block.virtue} className="absolute p-[3px]" style={place(block.rect)}>
            <h3 className="sr-only">
              {block.meta.nameKo} {block.subtotal}%
            </h3>

            <ul className="relative h-full w-full">
              {block.tiles.map((tile) => {
                const showName = tile.area >= HEATMAP_NAME_MIN_AREA;
                const showRatio = tile.area >= HEATMAP_RATIO_MIN_AREA;

                return (
                  <li
                    key={tile.strengthCode}
                    className="absolute p-[1px]"
                    style={place(tile.rect)}
                  >
                    <div
                      className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[3px] px-1 text-center leading-tight"
                      style={fill(tile, block.meta.colorVar, maxRatio)}
                    >
                      {showName ? (
                        <span className="max-w-full truncate text-[11px]">
                          {tile.nameKo}
                        </span>
                      ) : (
                        <span className="sr-only">{tile.nameKo}</span>
                      )}

                      {showRatio ? (
                        <span className="num text-[10px]">{tile.ratio}%</span>
                      ) : (
                        <span className="sr-only">{tile.ratio}%</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      {/* 큰 덕목부터 늘어놓는다. 판의 칸도 큰 것부터 놓이므로 범례를 왼쪽부터
          읽으면 판을 왼쪽 위부터 읽는 것과 같은 차례가 된다 */}
      <div className="mt-3">
        <VirtueLegend
          rows={blocks
            .filter((block) => block.subtotal > 0)
            .map((block) => ({ virtue: block.virtue, ratio: block.subtotal }))}
        />
      </div>

      <p className="mt-3 text-sm text-muted">
        옅은 칸은 5%에 못 미친 강점, 빈 칸은 아직 아무도 고르지 않은 강점이에요.
        자리를 남기느라 실제보다 조금 크게 그렸어요.
      </p>
    </div>
  );
}
