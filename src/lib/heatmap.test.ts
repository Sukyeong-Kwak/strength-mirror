import { describe, expect, it } from "vitest";

import { buildHeatmap, tintPercent } from "./heatmap";
import { STRENGTHS, VIRTUES } from "./strengths";
import type { StrengthRatioRow } from "@/types/domain";

function row(
  strengthCode: StrengthRatioRow["strengthCode"],
  ratio: number,
): StrengthRatioRow {
  const strength = STRENGTHS.find((s) => s.code === strengthCode);
  if (strength === undefined) {
    throw new Error(`unknown strength code: ${strengthCode}`);
  }
  return {
    strengthCode,
    nameKo: strength.nameKo,
    virtue: strength.virtue,
    ratio,
  };
}

/** 실제 뷰가 내려주는 모양 — 5% 눈금, 합 100, 고르지 않은 강점은 행이 없다 */
const SAMPLE: StrengthRatioRow[] = [
  row("kindness", 20),
  row("humor", 15),
  row("perseverance", 15),
  row("teamwork", 10),
  row("honesty", 10),
  row("gratitude", 10),
  row("creativity", 5),
  row("curiosity", 5),
  row("leadership", 5),
  row("hope", 5),
  // 골랐지만 5% 눈금에서 0 으로 내려앉은 것
  row("prudence", 0),
];

describe("buildHeatmap", () => {
  it("고른 사람이 없어도 칸은 스물넷이다", () => {
    const tiles = buildHeatmap(SAMPLE).flatMap((block) => block.tiles);

    expect(tiles).toHaveLength(STRENGTHS.length);
    expect(new Set(tiles.map((tile) => tile.strengthCode)).size).toBe(
      STRENGTHS.length,
    );
  });

  it("아무도 고르지 않은 판에서도 칸은 스물넷이다", () => {
    const tiles = buildHeatmap([]).flatMap((block) => block.tiles);

    expect(tiles).toHaveLength(STRENGTHS.length);
    expect(tiles.every((tile) => !tile.received)).toBe(true);
  });

  it("덕목 칸은 여섯이고 소계는 속한 강점의 합이다", () => {
    const blocks = buildHeatmap(SAMPLE);

    expect(blocks).toHaveLength(VIRTUES.length);
    expect(blocks.reduce((sum, block) => sum + block.subtotal, 0)).toBe(100);

    for (const block of blocks) {
      const inner = block.tiles.reduce((sum, tile) => sum + tile.ratio, 0);
      expect(inner).toBe(block.subtotal);
    }
  });

  it("소계가 큰 덕목이 앞에 온다", () => {
    const subtotals = buildHeatmap(SAMPLE).map((block) => block.subtotal);

    expect([...subtotals].sort((a, b) => b - a)).toEqual(subtotals);
  });

  it("서버가 내려준 비율을 그대로 들고 있다", () => {
    const tiles = buildHeatmap(SAMPLE).flatMap((block) => block.tiles);
    const byCode = new Map(tiles.map((tile) => [tile.strengthCode, tile]));

    expect(byCode.get("kindness")?.ratio).toBe(20);
    expect(byCode.get("prudence")?.ratio).toBe(0);
    expect(byCode.get("spirituality")?.ratio).toBe(0);
  });

  it("0% 라도 받은 것과 아무도 안 고른 것을 가른다", () => {
    const tiles = buildHeatmap(SAMPLE).flatMap((block) => block.tiles);
    const byCode = new Map(tiles.map((tile) => [tile.strengthCode, tile]));

    expect(byCode.get("prudence")?.received).toBe(true);
    expect(byCode.get("spirituality")?.received).toBe(false);
  });

  it("넓은 칸이 곧 큰 비율이다", () => {
    const tiles = buildHeatmap(SAMPLE).flatMap((block) => block.tiles);
    const byCode = new Map(tiles.map((tile) => [tile.strengthCode, tile]));

    const big = byCode.get("kindness");
    const mid = byCode.get("humor");
    const small = byCode.get("creativity");
    const none = byCode.get("spirituality");

    expect(big!.area).toBeGreaterThan(mid!.area);
    expect(mid!.area).toBeGreaterThan(small!.area);
    expect(small!.area).toBeGreaterThan(none!.area);
  });

  it("칸 넓이를 다 합치면 판 전체가 된다", () => {
    const total = buildHeatmap(SAMPLE)
      .flatMap((block) => block.tiles)
      .reduce((sum, tile) => sum + tile.area, 0);

    expect(total).toBeCloseTo(100, 6);
  });

  /* 자리를 남기려고 눌린 만큼이 얼마인지 눈에 보이게 해둔다 */
  it("0% 칸들이 가져가는 자리는 전체의 10% 를 넘지 않는다", () => {
    const spare = buildHeatmap(SAMPLE)
      .flatMap((block) => block.tiles)
      .filter((tile) => tile.ratio === 0)
      .reduce((sum, tile) => sum + tile.area, 0);

    expect(spare).toBeLessThan(10);
  });

  it("칸은 덕목 칸 안에 들어간다", () => {
    for (const block of buildHeatmap(SAMPLE)) {
      for (const tile of block.tiles) {
        expect(tile.rect.x).toBeGreaterThanOrEqual(-1e-9);
        expect(tile.rect.y).toBeGreaterThanOrEqual(-1e-9);
        expect(tile.rect.x + tile.rect.w).toBeLessThanOrEqual(100 + 1e-9);
        expect(tile.rect.y + tile.rect.h).toBeLessThanOrEqual(100 + 1e-9);
      }
    }
  });
});

describe("tintPercent", () => {
  it("가장 큰 비율이 가장 진하다", () => {
    expect(tintPercent(20, 20)).toBe(75);
  });

  it("비율이 낮을수록 옅어진다", () => {
    expect(tintPercent(5, 20)).toBeLessThan(tintPercent(10, 20));
    expect(tintPercent(10, 20)).toBeLessThan(tintPercent(20, 20));
  });

  it("판의 최댓값에 견주므로 1등은 늘 가장 진하다", () => {
    expect(tintPercent(5, 5)).toBe(tintPercent(20, 20));
  });

  it("0% 는 색을 남기되 어떤 받은 칸보다도 옅다", () => {
    expect(tintPercent(0, 20)).toBeLessThan(tintPercent(5, 20));
    expect(tintPercent(0, 20)).toBeGreaterThan(0);
  });
});
