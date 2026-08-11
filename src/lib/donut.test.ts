import { describe, expect, it } from "vitest";

import {
  buildDonut,
  labelBox,
  DONUT_CX,
  DONUT_CY,
  DONUT_HEIGHT,
  DONUT_R,
  DONUT_WIDTH,
  type DonutArc,
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

/** 한쪽에 작은 조각을 몰아 이름표가 서로 밀리게 만든 판 */
const CROWDED: VirtueRatioRow[] = VIRTUES.map((virtue, index) => ({
  virtue,
  ratio: index === 0 ? 75 : 5,
}));

function overlaps(a: DonutArc, b: DonutArc): boolean {
  const one = labelBox(a);
  const two = labelBox(b);
  return (
    one.x < two.x + two.width &&
    two.x < one.x + one.width &&
    one.y < two.y + two.height &&
    two.y < one.y + one.height
  );
}

describe("buildDonut", () => {
  it("조각이 둘레를 빈틈없이 채운다", () => {
    const drawn = buildDonut(SIX).reduce((sum, arc) => sum + arc.length, 0);

    expect(drawn).toBeCloseTo(CIRCUMFERENCE, 6);
  });

  it("조각이 앞 조각 끝에서 이어진다", () => {
    let expected = 0;
    for (const arc of buildDonut(SIX)) {
      expect(arc.offset).toBeCloseTo(expected, 6);
      expected += arc.length;
    }
  });

  it("길이가 비율에 비례한다", () => {
    const byVirtue = new Map(buildDonut(SIX).map((arc) => [arc.virtue, arc]));

    expect(byVirtue.get("humanity")?.length).toBeCloseTo(CIRCUMFERENCE * 0.3, 6);
    expect(byVirtue.get("wisdom")?.length).toBeCloseTo(CIRCUMFERENCE * 0.1, 6);
  });

  it("받은 차례를 그대로 지킨다 — 조를 바꿔도 조각이 자리를 옮기지 않게", () => {
    expect(buildDonut(SIX).map((arc) => arc.virtue)).toEqual(
      SIX.map((row) => row.virtue),
    );
  });

  it("한 덕목이 100% 여도 온전한 고리를 그린다", () => {
    const arcs = buildDonut([{ virtue: "humanity", ratio: 100 }]);

    expect(arcs).toHaveLength(1);
    expect(arcs[0]?.length).toBeCloseTo(CIRCUMFERENCE, 6);
    expect(arcs[0]?.offset).toBe(0);
  });

  it("빈 목록은 조각을 만들지 않는다", () => {
    expect(buildDonut([])).toEqual([]);
  });

  /*
    이 셋이 이 파일의 핵심이다. 손가락으로 쓰는 앱이라 접어두고 손을 올리면
    나오게 할 수 없다. 어떤 판이 와도 여섯이 다 보이고, 겹치지 않고,
    그림판 안에 있어야 한다.
  */
  describe.each([
    ["고루 나뉜 판", SIX],
    ["한쪽에 몰린 판", CROWDED],
  ])("%s", (_label, rows) => {
    it("이름표가 하나도 빠지지 않는다", () => {
      expect(buildDonut(rows)).toHaveLength(rows.length);
    });

    it("이름표끼리 겹치지 않는다", () => {
      const arcs = buildDonut(rows);

      for (const [index, arc] of arcs.entries()) {
        for (const other of arcs.slice(index + 1)) {
          expect(overlaps(arc, other)).toBe(false);
        }
      }
    });

    it("이름표가 그림판을 벗어나지 않는다", () => {
      for (const arc of buildDonut(rows)) {
        const box = labelBox(arc);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(DONUT_WIDTH);
        expect(box.y + box.height).toBeLessThanOrEqual(DONUT_HEIGHT);
      }
    });

    it("이름표가 도넛을 덮지 않는다", () => {
      for (const arc of buildDonut(rows)) {
        const box = labelBox(arc);
        const nearEdge =
          arc.label.anchor === "start" ? box.x : box.x + box.width;
        expect(Math.abs(nearEdge - DONUT_CX)).toBeGreaterThan(DONUT_R);
      }
    });

    it("지시선이 조각 테두리에서 시작해 이름표에서 끝난다", () => {
      for (const arc of buildDonut(rows)) {
        const [edge, , tip] = arc.label.leader;
        // 첫 점은 고리 바깥 테두리 위에 있다
        expect(Math.hypot(edge.x - DONUT_CX, edge.y - DONUT_CY)).toBeCloseTo(
          DONUT_R + 15,
          6,
        );
        // 끝점은 이름표와 같은 높이다
        expect(tip.y).toBeCloseTo(arc.label.y, 6);
      }
    });
  });

  it("한쪽에 몰리면 이름표가 제자리에서 밀려난다", () => {
    const arcs = buildDonut(CROWDED);
    const moved = arcs.filter((arc) => {
      const [, elbow] = arc.label.leader;
      return Math.abs(elbow.y - arc.label.y) > 1;
    });

    // 밀려난 것이 하나도 없다면 이 판이 빽빽하지 않다는 뜻이라 검사가 헛돈다
    expect(moved.length).toBeGreaterThan(0);
  });

  it("오른쪽 이름표는 왼쪽 맞춤, 왼쪽 이름표는 오른쪽 맞춤", () => {
    for (const arc of buildDonut(SIX)) {
      if (arc.label.anchor === "start") {
        expect(arc.label.x).toBeGreaterThan(DONUT_CX);
      } else {
        expect(arc.label.x).toBeLessThan(DONUT_CX);
      }
    }
  });
});
