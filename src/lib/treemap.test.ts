import { describe, expect, it } from "vitest";

import { squarify, type Rect, type TreemapTile } from "./treemap";

const BOARD: Rect = { x: 0, y: 0, w: 3, h: 2 };

function areaOf(rect: Rect): number {
  return rect.w * rect.h;
}

/** 두 사각형이 겹치는 넓이. 트리맵은 이것이 언제나 0 이어야 한다 */
function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return Math.max(w, 0) * Math.max(h, 0);
}

function values(...list: number[]) {
  return list.map((value) => ({ value, datum: value }));
}

describe("squarify", () => {
  it("주어진 사각형을 빈틈없이 채운다", () => {
    const tiles = squarify(values(40, 25, 15, 10, 6, 4), BOARD);
    const total = tiles.reduce((sum, tile) => sum + areaOf(tile), 0);

    expect(total).toBeCloseTo(areaOf(BOARD), 10);
  });

  it("넓이가 값에 비례한다", () => {
    const tiles = squarify(values(50, 30, 20), BOARD);
    const byValue = new Map(tiles.map((tile) => [tile.datum, areaOf(tile)]));

    expect(byValue.get(50)).toBeCloseTo(areaOf(BOARD) * 0.5, 10);
    expect(byValue.get(30)).toBeCloseTo(areaOf(BOARD) * 0.3, 10);
    expect(byValue.get(20)).toBeCloseTo(areaOf(BOARD) * 0.2, 10);
  });

  it("칸끼리 겹치지 않는다", () => {
    const tiles = squarify(values(30, 22, 18, 12, 9, 5, 3, 1), BOARD);

    for (const [index, tile] of tiles.entries()) {
      for (const other of tiles.slice(index + 1)) {
        expect(overlap(tile, other)).toBeCloseTo(0, 10);
      }
    }
  });

  it("모든 칸이 사각형 안에 있다", () => {
    const tiles = squarify(values(30, 22, 18, 12, 9, 5, 3, 1), BOARD);

    for (const tile of tiles) {
      expect(tile.x).toBeGreaterThanOrEqual(BOARD.x - 1e-9);
      expect(tile.y).toBeGreaterThanOrEqual(BOARD.y - 1e-9);
      expect(tile.x + tile.w).toBeLessThanOrEqual(BOARD.x + BOARD.w + 1e-9);
      expect(tile.y + tile.h).toBeLessThanOrEqual(BOARD.y + BOARD.h + 1e-9);
    }
  });

  /*
    이 검사가 squarified 를 쓰는 이유 그 자체다. 값 순서대로 그냥 잘라 나가면
    작은 칸이 1:40 짜리 실오라기가 되어 이름을 넣을 수 없다.
  */
  it("칸이 실오라기처럼 길어지지 않는다", () => {
    const tiles = squarify(values(30, 20, 15, 12, 9, 6, 4, 3, 1), BOARD);

    for (const tile of tiles) {
      const aspect = Math.max(tile.w / tile.h, tile.h / tile.w);
      expect(aspect).toBeLessThan(6);
    }
  });

  it("값이 큰 것부터 넣으면 첫 칸이 가장 넓다", () => {
    const tiles = squarify(values(40, 25, 20, 15), BOARD);
    const largest = tiles.reduce((best: TreemapTile<number>, tile) =>
      areaOf(tile) > areaOf(best) ? tile : best,
    );

    expect(largest.datum).toBe(40);
  });

  it("0 이하인 값과 빈 목록은 칸을 만들지 않는다", () => {
    expect(squarify(values(0, -3), BOARD)).toEqual([]);
    expect(squarify([], BOARD)).toEqual([]);
    expect(squarify(values(1, 0, 2), BOARD)).toHaveLength(2);
  });

  it("넓이가 없는 사각형에는 아무것도 놓지 않는다", () => {
    expect(squarify(values(1, 2), { x: 0, y: 0, w: 0, h: 2 })).toEqual([]);
  });
});
