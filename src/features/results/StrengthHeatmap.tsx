import type { CSSProperties } from "react";

import { VirtueLegend } from "@/components/RatioBar";
import {
  HEATMAP_ASPECT,
  HEATMAP_NAME_MIN_AREA,
  HEATMAP_RATIO_MIN_AREA,
} from "@/lib/constants";
import { buildHeatmap, tintPercent, type HeatmapTile } from "@/lib/heatmap";
import { getStrength } from "@/lib/strengths";
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

      <SmallTiles tiles={blocks.flatMap((block) => block.tiles)} />

      <p className="mt-3 text-sm text-muted">
        작은 칸도 자리를 남기느라 실제 비율보다 조금 크게 그렸어요.
      </p>
    </div>
  );
}

/**
 * 판에서 이름이 안 보이는 칸들.
 *
 * 5% 눈금 아래로 내려간 강점은 칸이 20px 남짓이라 글자가 들어가지 않는다.
 * 판 위에서는 옅은 색과 빈 칸으로 "여기 뭔가 있다" 까지만 말할 수 있고,
 * 그게 무엇인지는 말하지 못한다. 그래서 이름을 판 아래에 글자로 적는다.
 *
 * 손을 올리면 나오게 하지 않는다. 이 앱은 손가락으로 쓰는 앱이라
 * hover 가 없는 기기에서는 그 이름을 볼 방법이 사라진다.
 *
 * 두 줄로 나누는 것은 판이 이미 두 색으로 갈라 놓았기 때문이다.
 * 적게 받은 것과 아직 아무도 안 고른 것은 다른 이야기다 —
 * 앞은 누군가 봐준 것이고, 뒤는 아직 아무도 못 본 것이다.
 */
function SmallTiles({ tiles }: { tiles: readonly HeatmapTile[] }) {
  // VIA 표의 차례로 적는다. 판의 자리 순서로 적으면 읽는 차례가 들쭉날쭉하다
  const unlabelled = tiles
    .filter((tile) => tile.ratio === 0)
    .sort(
      (a, b) =>
        getStrength(a.strengthCode).order - getStrength(b.strengthCode).order,
    );

  const traces = unlabelled.filter((tile) => tile.received);
  const empties = unlabelled.filter((tile) => !tile.received);

  if (unlabelled.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-base border border-line bg-surface px-4 py-3">
      {traces.length > 0 && (
        <div>
          <p className="text-sm text-muted">옅은 칸 · 5%에 못 미쳤어요</p>
          <p className="mt-1 text-base">
            {traces.map((tile) => tile.nameKo).join(" · ")}
          </p>
        </div>
      )}

      {empties.length > 0 && (
        <div>
          <p className="text-sm text-muted">빈 칸 · 아직 아무도 고르지 않았어요</p>
          <p className="mt-1 text-base text-muted">
            {empties.map((tile) => tile.nameKo).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
