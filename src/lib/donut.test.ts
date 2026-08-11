import { describe, expect, it } from "vitest";

import {
  buildDonut,
  DONUT_CX,
  DONUT_CY,
  DONUT_HEIGHT,
  DONUT_R,
  DONUT_WIDTH,
} from "./donut";
import { VIRTUES } from "./strengths";
import type { VirtueRatioRow } from "@/types/domain";

const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

/** 실제 화면에 나온 값 — 여섯 덕목이 5% 눈금으로 100 을 나눠 가진다 */
const SIX: VirtueRatioRow[] = [
  { virtue: "wisdom", ratio: 10 },
  { virtue: "courage", ratio: 10 },
  { virtue: "humanity", ratio: 30 },
  { virtue: "justice", ratio: 10 },
  { virtue: "temperance", ratio: 20 },
  { virtue: "transcendence", ratio: 20 },
];

describe("buildDonut", () => {
  it("조각이 둘레를 빈틈없이 채운다", () => {
    const arcs = buildDonut(SIX);
    const drawn = arcs.reduce((sum, arc) => sum + arc.length, 0);

    expect(drawn).toBeCloseTo(CIRCUMFERENCE, 6);
  });

  it("조각이 앞 조각 끝에서 이어진다", () => {
    const arcs = buildDonut(SIX);

    let expected = 0;
    for (const arc of arcs) {
      expect(arc.offset).toBeCloseTo(expected, 6);
      expected += arc.length;
    }
  });

  it("길이가 비율에 비례한다", () => {
    const arcs = buildDonut(SIX);
    const byVirtue = new Map(arcs.map((arc) => [arc.virtue, arc]));

    expect(byVirtue.get("humanity")?.length).toBeCloseTo(CIRCUMFERENCE * 0.3, 6);
    expect(byVirtue.get("wisdom")?.length).toBeCloseTo(CIRCUMFERENCE * 0.1, 6);
  });

  it("받은 차례를 그대로 지킨다 — 조를 바꿔도 조각이 자리를 옮기지 않게", () => {
    const arcs = buildDonut(SIX);

    expect(arcs.map((arc) => arc.virtue)).toEqual(SIX.map((row) => row.virtue));
  });

  it("한 덕목이 100% 여도 온전한 고리를 그린다", () => {
    const arcs = buildDonut([{ virtue: "humanity", ratio: 100 }]);

    expect(arcs).toHaveLength(1);
    expect(arcs[0]?.length).toBeCloseTo(CIRCUMFERENCE, 6);
    expect(arcs[0]?.offset).toBe(0);
    expect(arcs[0]?.label.hidden).toBe(false);
  });

  it("빈 목록은 조각을 만들지 않는다", () => {
    expect(buildDonut([])).toEqual([]);
  });

  /* 여섯이 고루 나뉜 판은 이름표가 하나도 접히지 않아야 한다 */
  it("실제 집계에서는 여섯 이름표가 모두 보인다", () => {
    const arcs = buildDonut(SIX);

    expect(arcs.every((arc) => !arc.label.hidden)).toBe(true);
  });

  it("보이는 이름표끼리는 겹치지 않는다", () => {
    const boxes = buildDonut(SIX)
      .filter((arc) => !arc.label.hidden)
      .map((arc) => arc.label.box);

    for (const [index, a] of boxes.entries()) {
      for (const b of boxes.slice(index + 1)) {
        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it("보이는 이름표는 그림판 안에 있다", () => {
    for (const arc of buildDonut(SIX)) {
      if (arc.label.hidden) {
        continue;
      }
      expect(arc.label.box.x).toBeGreaterThanOrEqual(0);
      expect(arc.label.box.y).toBeGreaterThanOrEqual(0);
      expect(arc.label.box.x + arc.label.box.width).toBeLessThanOrEqual(DONUT_WIDTH);
      expect(arc.label.box.y + arc.label.box.height).toBeLessThanOrEqual(DONUT_HEIGHT);
    }
  });

  /*
    자리가 모자라면 접힌다는 것 자체를 못 박아 둔다. 접히는 일이 아예 없다면
    손을 올려야 나오는 길이 죽은 코드라는 뜻이다.
  */
  it("잘게 갈린 판에서는 작은 쪽 이름표가 접힌다", () => {
    const crowded: VirtueRatioRow[] = VIRTUES.map((virtue, index) => ({
      virtue,
      // 한쪽에 5% 짜리를 몰아 붙여 이름표가 겹치게 만든다
      ratio: index === 0 ? 75 : 5,
    }));

    const arcs = buildDonut(crowded);
    const hidden = arcs.filter((arc) => arc.label.hidden);

    expect(hidden.length).toBeGreaterThan(0);
    // 가장 큰 조각은 무슨 일이 있어도 살아남는다
    expect(arcs.find((arc) => arc.ratio === 75)?.label.hidden).toBe(false);
  });

  it("이름표는 도넛 바깥에 앉는다", () => {
    for (const arc of buildDonut(SIX)) {
      const dx = arc.label.x - DONUT_CX;
      const dy = arc.label.y - DONUT_CY;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(DONUT_R);
    }
  });

  it("오른쪽 이름표는 왼쪽 맞춤, 왼쪽 이름표는 오른쪽 맞춤", () => {
    for (const arc of buildDonut(SIX)) {
      if (arc.label.anchor === "start") {
        expect(arc.label.x).toBeGreaterThan(DONUT_CX);
      }
      if (arc.label.anchor === "end") {
        expect(arc.label.x).toBeLessThan(DONUT_CX);
      }
    }
  });
});
