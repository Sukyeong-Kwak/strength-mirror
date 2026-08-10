import { describe, expect, it } from "vitest";

import type { StrengthRatioRow, VirtueRatioRow } from "@/types/domain";

import {
  excludeZeroRatio,
  groupByVirtue,
  sortByRatioDesc,
  splitByVisibility,
  sumRatio,
  toVirtueSegments,
} from "./ratio";
import { VIRTUES } from "./strengths";

function row(
  strengthCode: StrengthRatioRow["strengthCode"],
  nameKo: string,
  virtue: StrengthRatioRow["virtue"],
  ratio: number,
): StrengthRatioRow {
  return { strengthCode, nameKo, virtue, ratio };
}

// 합이 정확히 100인 표본
const SAMPLE: StrengthRatioRow[] = [
  row("kindness", "친절", "humanity", 30),
  row("love", "사랑", "humanity", 10),
  row("bravery", "용감함", "courage", 25),
  row("honesty", "정직", "courage", 5),
  row("creativity", "창의성", "wisdom", 20),
  row("teamwork", "협동심", "justice", 10),
];

describe("sortByRatioDesc", () => {
  it("내림차순으로 정렬한다", () => {
    const sorted = sortByRatioDesc(SAMPLE);
    expect(sorted.map((r) => r.ratio)).toEqual([30, 25, 20, 10, 10, 5]);
  });

  it("같은 값이면 원래 순서를 유지한다", () => {
    const sorted = sortByRatioDesc(SAMPLE);
    const tied = sorted.filter((r) => r.ratio === 10).map((r) => r.strengthCode);
    expect(tied).toEqual(["love", "teamwork"]);
  });

  it("원본을 바꾸지 않는다", () => {
    const before = SAMPLE.map((r) => r.strengthCode);
    sortByRatioDesc(SAMPLE);
    expect(SAMPLE.map((r) => r.strengthCode)).toEqual(before);
  });

  it("빈 배열을 처리한다", () => {
    expect(sortByRatioDesc([])).toEqual([]);
  });
});

describe("excludeZeroRatio", () => {
  it("0% 를 걸러낸다", () => {
    const rows = [...SAMPLE, row("humor", "유머", "transcendence", 0)];
    const kept = excludeZeroRatio(rows);
    expect(kept).toHaveLength(SAMPLE.length);
    expect(kept.some((r) => r.strengthCode === "humor")).toBe(false);
  });

  it("전부 0이면 빈 배열", () => {
    expect(excludeZeroRatio([row("humor", "유머", "transcendence", 0)])).toEqual(
      [],
    );
  });

  it("빈 배열을 처리한다", () => {
    expect(excludeZeroRatio([])).toEqual([]);
  });
});

describe("splitByVisibility", () => {
  it("0% 는 막대에서 빼되 이름은 남긴다", () => {
    const rows = [
      ...SAMPLE,
      row("humor", "유머", "transcendence", 0),
      row("prudence", "신중함", "temperance", 0),
    ];
    const { charted, mentioned } = splitByVisibility(rows);

    expect(charted).toHaveLength(SAMPLE.length);
    expect(mentioned.map((r) => r.nameKo)).toEqual(["유머", "신중함"]);
  });

  it("막대는 비율 내림차순으로 나온다", () => {
    const { charted } = splitByVisibility(SAMPLE);
    expect(charted.map((r) => r.ratio)).toEqual([30, 25, 20, 10, 10, 5]);
  });

  it("언급 목록은 서버가 준 순서를 그대로 둔다", () => {
    const { mentioned } = splitByVisibility([
      row("humor", "유머", "transcendence", 0),
      row("love", "사랑", "humanity", 0),
    ]);
    expect(mentioned.map((r) => r.strengthCode)).toEqual(["humor", "love"]);
  });

  it("전부 0이면 막대가 하나도 없다", () => {
    const { charted, mentioned } = splitByVisibility([
      row("humor", "유머", "transcendence", 0),
    ]);
    expect(charted).toEqual([]);
    expect(mentioned).toHaveLength(1);
  });

  it("0이 없으면 언급 목록이 비어 있다", () => {
    const { charted, mentioned } = splitByVisibility(SAMPLE);
    expect(charted).toHaveLength(SAMPLE.length);
    expect(mentioned).toEqual([]);
  });

  it("빈 배열을 처리한다", () => {
    expect(splitByVisibility([])).toEqual({ charted: [], mentioned: [] });
  });

  it("원본을 바꾸지 않는다", () => {
    const before = SAMPLE.map((r) => r.strengthCode);
    splitByVisibility(SAMPLE);
    expect(SAMPLE.map((r) => r.strengthCode)).toEqual(before);
  });
});

describe("5% 눈금 — 서버가 내려주는 값의 성질", () => {
  // DB 뷰가 20칸 최대잔여법으로 계산한다. 화면은 이 성질을 전제로 그린다
  it("모든 비율이 5의 배수다", () => {
    expect(SAMPLE.every((r) => r.ratio % 5 === 0)).toBe(true);
  });

  it("합이 정확히 100이다", () => {
    expect(sumRatio(SAMPLE)).toBe(100);
  });

  it("덕목 소계도 5의 배수이고 합이 100이다", () => {
    const groups = groupByVirtue(SAMPLE);
    expect(groups.every((g) => g.subtotal % 5 === 0)).toBe(true);
    expect(groups.reduce((total, g) => total + g.subtotal, 0)).toBe(100);
  });
});

describe("groupByVirtue", () => {
  it("덕목 6개를 모두 반환한다", () => {
    const groups = groupByVirtue(SAMPLE);
    expect(groups).toHaveLength(VIRTUES.length);
    expect([...groups].map((g) => g.virtue).sort()).toEqual(
      [...VIRTUES].sort(),
    );
  });

  it("소계의 합이 입력 비율의 합과 같다 — 100이 유지된다", () => {
    const groups = groupByVirtue(SAMPLE);
    expect(sumRatio(SAMPLE)).toBe(100);
    expect(groups.reduce((total, g) => total + g.subtotal, 0)).toBe(100);
  });

  it("소계 내림차순으로 섹션을 정렬한다", () => {
    const groups = groupByVirtue(SAMPLE);
    expect(groups.map((g) => g.virtue)).toEqual([
      "humanity", // 40
      "courage", // 30
      "wisdom", // 20
      "justice", // 10
      "temperance", // 0
      "transcendence", // 0
    ]);
  });

  it("섹션 안에서도 비율 내림차순이다", () => {
    const humanity = groupByVirtue(SAMPLE).find((g) => g.virtue === "humanity");
    expect(humanity?.rows.map((r) => r.strengthCode)).toEqual([
      "kindness",
      "love",
    ]);
  });

  it("빈 배열이면 6개 섹션이 모두 0으로 나온다", () => {
    const groups = groupByVirtue([]);
    expect(groups).toHaveLength(VIRTUES.length);
    expect(groups.every((g) => g.subtotal === 0)).toBe(true);
    expect(groups.every((g) => g.rows.length === 0)).toBe(true);
  });

  it("소계가 같으면 덕목 고유 순서를 따른다", () => {
    const groups = groupByVirtue([
      row("spirituality", "영성", "transcendence", 50),
      row("creativity", "창의성", "wisdom", 50),
    ]);
    expect(groups.slice(0, 2).map((g) => g.virtue)).toEqual([
      "wisdom",
      "transcendence",
    ]);
  });
});

describe("toVirtueSegments", () => {
  it("0% 구간을 빼고 덕목 고유 순서로 돌려준다", () => {
    const rows: VirtueRatioRow[] = [
      { virtue: "transcendence", ratio: 30 },
      { virtue: "wisdom", ratio: 70 },
      { virtue: "justice", ratio: 0 },
    ];
    expect(toVirtueSegments(rows)).toEqual([
      { virtue: "wisdom", ratio: 70 },
      { virtue: "transcendence", ratio: 30 },
    ]);
  });

  it("구간 합이 100을 유지한다", () => {
    const rows: VirtueRatioRow[] = [
      { virtue: "humanity", ratio: 34 },
      { virtue: "courage", ratio: 33 },
      { virtue: "wisdom", ratio: 33 },
    ];
    expect(sumRatio(toVirtueSegments(rows))).toBe(100);
  });

  it("빈 배열이면 빈 배열", () => {
    expect(toVirtueSegments([])).toEqual([]);
  });
});
