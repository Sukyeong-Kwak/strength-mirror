/**
 * 히트맵 판 만들기 — 덕목 6칸, 그 안에 강점 24칸.
 *
 * 주식 히트맵과 같은 읽는 법이다. 큰 네모 하나가 덕목이고 색이 곧 덕목이다.
 * 그 안의 작은 네모가 강점이고, 넓이가 그 강점이 차지한 비율이다.
 * 다 합치면 100% 다.
 *
 * 막대 차트는 위에서 아래로 읽어야 순위가 보이지만, 이 판은 한눈에
 * "우리는 어느 쪽으로 기울어 있나" 가 먼저 보인다. 그래서 전체 집계의
 * 첫 화면으로 둔다.
 *
 * 24칸을 다 그린다. 아무도 고르지 않은 강점도 자리를 남긴다 —
 * 무엇이 모였는지만큼 무엇이 비어 있는지도 이 판이 말해야 할 것이다.
 * 대신 받은 것과 받지 않은 것은 색으로 갈라 보인다 (received).
 *
 * 여기 있는 것은 전부 순수 함수다. 화면은 나온 사각형을 퍼센트로 놓기만 한다.
 */

import { HEATMAP_ASPECT, HEATMAP_EMPTY_WEIGHT } from "./constants";
import {
  STRENGTHS,
  VIRTUES,
  VIRTUE_META,
  type StrengthCode,
  type VirtueCode,
  type VirtueMeta,
} from "./strengths";
import { squarify, type Rect } from "./treemap";
import type { StrengthRatioRow } from "@/types/domain";

export type HeatmapTile = {
  strengthCode: StrengthCode;
  nameKo: string;
  virtue: VirtueCode;
  /** 서버가 내려준 진짜 비율. 넓이와 달리 손대지 않는다 */
  ratio: number;
  /** 한 명이라도 골라준 사람이 있는지. 0% 인 것과 아무도 안 고른 것은 다르다 */
  received: boolean;
  /** 덕목 칸 안에서의 자리 (0~100 %) */
  rect: Rect;
  /** 판 전체를 100 으로 봤을 때 이 칸의 넓이. 글자를 넣을지 정하는 데 쓴다 */
  area: number;
};

export type HeatmapBlock = {
  virtue: VirtueCode;
  meta: VirtueMeta;
  /** 덕목 소계. 속한 강점 비율의 합이다 */
  subtotal: number;
  /** 판 전체에서의 자리 (0~100 %) */
  rect: Rect;
  tiles: readonly HeatmapTile[];
};

/**
 * 칸 색의 진하기 (덕목 색을 흰색과 섞는 비율, %).
 *
 * 색 하나로는 24칸의 크고 작음이 한 번 더 읽히지 않는다. 진하기를 같이
 * 움직여 큰 칸이 앞으로 나오게 한다.
 *
 * 상한이 75인 것은 눈으로 고른 값이 아니다. 칸 안의 글자는 언제나 본문
 * 먹색(#101114)인데, 그 글자가 흰 배경 대비 4.5:1 을 넘는 가장 진한
 * 섞임이 여섯 덕목 모두에서 75% 다 (가장 나쁜 용기 4.60:1). 여기서 더
 * 진하게 하면 가장 큰 칸의 이름부터 읽히지 않는다.
 *
 * 섞는 방식은 sRGB 다. 위 대비를 sRGB 로 계산했으므로 화면에서도
 * color-mix(in srgb, ...) 여야 한다. oklab 으로 섞으면 값이 달라진다.
 */
const TINT_LADDER = [22, 38, 56, 75] as const;

/** 0% 지만 누군가 골라준 강점. 색은 남기되 가장 옅게 둔다 */
const TINT_TRACE = 12;

/**
 * 비율을 색 진하기로 바꾼다.
 *
 * 절대값이 아니라 그 판의 최댓값에 견준다. 전체 집계는 24갈래로 갈려
 * 1등이 15% 인 판이 흔한데, 절대값으로 칠하면 판 전체가 옅어져
 * 어디가 큰지 보이지 않는다.
 */
export function tintPercent(ratio: number, maxRatio: number): number {
  if (ratio <= 0) {
    return TINT_TRACE;
  }
  if (maxRatio <= 0) {
    return TINT_LADDER[0];
  }

  const step = Math.ceil((ratio / maxRatio) * TINT_LADDER.length);
  return TINT_LADDER.at(Math.min(Math.max(step, 1), TINT_LADDER.length) - 1) ?? TINT_LADDER[0];
}

/** 넓이를 정하는 값. 0% 도 자리는 남긴다 */
function weightOf(ratio: number): number {
  return ratio > 0 ? ratio : HEATMAP_EMPTY_WEIGHT;
}

type Entry = {
  strengthCode: StrengthCode;
  nameKo: string;
  virtue: VirtueCode;
  ratio: number;
  received: boolean;
  order: number;
};

/**
 * 강점 비율에서 히트맵 판을 만든다.
 *
 * 서버가 내려준 행에 없는 강점은 아무도 고르지 않은 것이다 (뷰가 0건인
 * 강점의 행 자체를 만들지 않는다). 그래서 24개 목록 쪽을 기준으로 삼고
 * 받은 비율을 얹는다. 행 쪽을 기준으로 돌면 칸이 24개가 되지 않는다.
 */
export function buildHeatmap(
  rows: readonly StrengthRatioRow[],
  aspect: number = HEATMAP_ASPECT,
): HeatmapBlock[] {
  const ratioByCode = new Map<string, number>(
    rows.map((row) => [row.strengthCode, row.ratio]),
  );

  const byVirtue = new Map<VirtueCode, Entry[]>(
    VIRTUES.map((virtue) => [virtue, []]),
  );

  for (const strength of STRENGTHS) {
    const ratio = ratioByCode.get(strength.code);
    byVirtue.get(strength.virtue)?.push({
      strengthCode: strength.code,
      nameKo: strength.nameKo,
      virtue: strength.virtue,
      ratio: ratio ?? 0,
      received: ratio !== undefined,
      order: strength.order,
    });
  }

  const groups = VIRTUES.map((virtue) => {
    const entries = byVirtue.get(virtue) ?? [];
    // 큰 것부터 놓아야 칸이 정사각형에 가깝다. 같으면 VIA 표의 차례를 지킨다
    const sorted = [...entries].sort((a, b) =>
      b.ratio === a.ratio ? a.order - b.order : b.ratio - a.ratio,
    );
    return {
      virtue,
      meta: VIRTUE_META[virtue],
      subtotal: sorted.reduce((sum, entry) => sum + entry.ratio, 0),
      weight: sorted.reduce((sum, entry) => sum + weightOf(entry.ratio), 0),
      entries: sorted,
    };
  }).sort((a, b) =>
    b.subtotal === a.subtotal
      ? a.meta.order - b.meta.order
      : b.subtotal - a.subtotal,
  );

  // 종횡비를 계산에 넣기 위해 "가로 = 종횡비, 세로 = 1" 인 공간에서 나눈다
  const board: Rect = { x: 0, y: 0, w: aspect, h: 1 };
  const boardArea = board.w * board.h;

  const placed = squarify(
    groups.map((group) => ({ value: group.weight, datum: group })),
    board,
  );

  return placed.map((block) => {
    const group = block.datum;
    const inner: Rect = { x: 0, y: 0, w: block.w, h: block.h };

    const tiles = squarify(
      group.entries.map((entry) => ({
        value: weightOf(entry.ratio),
        datum: entry,
      })),
      inner,
    ).map((tile) => ({
      strengthCode: tile.datum.strengthCode,
      nameKo: tile.datum.nameKo,
      virtue: tile.datum.virtue,
      ratio: tile.datum.ratio,
      received: tile.datum.received,
      rect: toPercent(tile, inner),
      area: ((tile.w * tile.h) / boardArea) * 100,
    }));

    return {
      virtue: group.virtue,
      meta: group.meta,
      subtotal: group.subtotal,
      rect: toPercent(block, board),
      tiles,
    };
  });
}

/** 부모 사각형 안에서의 자리를 퍼센트로 바꾼다 */
function toPercent(rect: Rect, parent: Rect): Rect {
  return {
    x: ((rect.x - parent.x) / parent.w) * 100,
    y: ((rect.y - parent.y) / parent.h) * 100,
    w: (rect.w / parent.w) * 100,
    h: (rect.h / parent.h) * 100,
  };
}
