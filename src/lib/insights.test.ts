import { describe, expect, it } from "vitest";

import type { ReasonEntry, StrengthRatioRow } from "@/types/domain";

import {
  complementPeople,
  distinctiveStrengths,
  groupProfiles,
  hiddenStrengths,
  pickQuote,
  similarPeople,
  topStrengths,
} from "./insights";
import { STRENGTHS, getStrength, type StrengthCode } from "./strengths";

function r(code: StrengthCode, ratio: number): StrengthRatioRow {
  const s = getStrength(code);
  return { strengthCode: code, nameKo: s.nameKo, virtue: s.virtue, ratio };
}

describe("topStrengths", () => {
  it("5% 에 못 미친 것은 빼고 큰 순으로", () => {
    const rows = [r("love", 0), r("kindness", 50), r("humor", 50)];
    expect(topStrengths(rows, 3).map((x) => x.strengthCode)).toEqual(["kindness", "humor"]);
  });

  it("전부 5% 아래면 받은 것 그대로 보여준다", () => {
    expect(topStrengths([r("love", 0)]).map((x) => x.strengthCode)).toEqual(["love"]);
  });
});

describe("distinctiveStrengths", () => {
  it("많이 받은 순이 아니라 전체보다 더 받은 순", () => {
    const mine = [r("kindness", 50), r("bravery", 30), r("humor", 20)];
    const everyone = [r("kindness", 60), r("bravery", 5), r("humor", 10)];
    expect(distinctiveStrengths(mine, everyone).map((d) => d.code)).toEqual([
      "bravery",
      "humor",
    ]);
  });

  it("전체에 없던 강점도 차이로 센다", () => {
    const [first] = distinctiveStrengths([r("zest", 10)], []);
    expect(first).toEqual({ code: "zest", mine: 10, everyone: 0 });
  });
});

describe("pickQuote", () => {
  const entry = (reason: string, createdAt: string): ReasonEntry => ({
    personId: "p",
    strengthCode: "kindness",
    reason,
    createdAt,
  });

  it("60자 가까운 이야기를 고르고, 너무 길면 줄인다", () => {
    const short = entry("짧은 이야기예요 정말로", "2026-01-01");
    const mid = entry("가".repeat(58), "2026-01-01");
    expect(pickQuote([short, mid], "kindness")).toBe(mid.reason);
    expect(pickQuote([entry("나".repeat(200), "x")], "kindness")).toHaveLength(91);
  });

  it("그 강점의 이야기가 없으면 null", () => {
    expect(pickQuote([entry("이야기가 여기에 있어요", "x")], "humor")).toBeNull();
  });
});

describe("similarPeople · complementPeople", () => {
  const all = new Map<string, StrengthRatioRow[]>([
    ["me", [r("kindness", 60), r("humor", 40)]],
    ["twin", [r("kindness", 55), r("humor", 45)]],
    ["half", [r("kindness", 50), r("bravery", 50)]],
    ["other", [r("bravery", 70), r("creativity", 30)]],
  ]);

  it("모양이 가장 닮은 사람이 앞에 오고, 겹치지 않으면 빠진다", () => {
    const similar = similarPeople("me", all, 5);
    expect(similar.map((s) => s.personId)).toEqual(["twin", "half"]);
    expect(similar[0]?.shared).toEqual(["kindness", "humor"]);
  });

  it("나에게 없는 강점을 많이 가진 사람", () => {
    const comp = complementPeople("me", all, new Set(["twin"]), 5);
    expect(comp.map((c) => c.personId)).toEqual(["other", "half"]);
    expect(comp[0]?.brings).toEqual(["bravery", "creativity"]);
  });

  it("받은 것이 없으면 아무도 보여주지 않는다", () => {
    expect(similarPeople("nobody", all)).toEqual([]);
    expect(complementPeople("nobody", all)).toEqual([]);
  });
});

describe("groupProfiles", () => {
  it("대표 덕목, 나온 강점 수, 유독 보인 강점", () => {
    const groups = new Map([["1조", [r("kindness", 40), r("love", 30), r("bravery", 30)]]]);
    const [profile] = groupProfiles(groups, [r("kindness", 50), r("love", 40), r("bravery", 10)]);
    expect(profile).toMatchObject({
      groupName: "1조",
      topVirtue: "humanity",
      topVirtueRatio: 70,
      covered: 3,
      distinctive: "bravery",
    });
  });
});

describe("hiddenStrengths", () => {
  it("아무도 안 고른 것과 5% 아래인 것을 가른다", () => {
    const { untouched, rare } = hiddenStrengths([r("kindness", 100), r("humor", 0)]);
    expect(rare.map((s) => s.code)).toEqual(["humor"]);
    expect(untouched).toHaveLength(STRENGTHS.length - 2);
  });
});
