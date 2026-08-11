/**
 * 덕목 도넛의 조각과 이름표 자리.
 *
 * 이름표를 그림 밖에 줄줄이 늘어놓지 않고 조각마다 붙인다. 색과 이름을
 * 눈으로 잇는 일(범례 왕복)이 사라지면 그림 하나만 보면 된다.
 *
 * 여섯 개를 언제나 다 보여준다. 처음에는 자리가 없으면 접어두고 손을 올리면
 * 나오게 했는데, 이 앱은 손가락으로 쓰는 앱이다. 마우스가 없는 기기에는
 * hover 가 아예 없으므로 접는 순간 그 덕목은 볼 방법이 사라진다.
 *
 * 그래서 접는 대신 밀어낸다. 이름표를 도넛 양옆 두 줄에 세우고, 겹치는
 * 것끼리 위아래로 밀어 띄운 다음, 밀려난 이름표와 제 조각을 지시선으로
 * 잇는다. 자리가 밀려도 어느 조각의 이름인지는 선이 말해준다.
 *
 * 글자 폭은 재지 않고 글자 수로 어림잡는다. 서버에서 그리는 그림이라
 * 실제 폭을 알 방법이 없다. 넉넉하게 잡는 쪽으로 기운다.
 *
 * 좌표는 전부 viewBox 단위다. 화면이 좁아지면 그림째로 줄어들 뿐,
 * 좁은 기기에서만 이름표가 사라지는 일은 없다.
 */

import type { VirtueRatioRow } from "@/types/domain";

import { VIRTUE_META, type VirtueCode } from "./strengths";

/** 그림판 크기. 컴포넌트의 viewBox 와 같은 값이어야 한다 */
export const DONUT_WIDTH = 360;
export const DONUT_HEIGHT = 250;

export const DONUT_CX = DONUT_WIDTH / 2;
export const DONUT_CY = DONUT_HEIGHT / 2;
/** 고리 한가운데 반지름. stroke 가 이 선을 중심으로 양쪽으로 퍼진다 */
export const DONUT_R = 58;
export const DONUT_STROKE = 30;

/** 고리 바깥 테두리 */
const OUTER_R = DONUT_R + DONUT_STROKE / 2;
/** 지시선이 방향을 트는 자리 */
const ELBOW_R = OUTER_R + 10;
/** 이름표 줄이 서는 자리. 도넛에서 이만큼 떨어뜨린다 */
const COLUMN_GAP = 16;

/** 어림잡는 글자 폭 (viewBox 단위) */
const NAME_SIZE = 12;
const PCT_SIZE = 11;
const SPACE_WIDTH = 4;

/** 이름표 한 덩이 — 이름 한 줄과 퍼센트 한 줄 */
const LABEL_HEIGHT = 26;
/** 이름표끼리 이만큼은 떨어져 있어야 붙어 보이지 않는다 */
const LABEL_MARGIN = 4;
const MIN_GAP = LABEL_HEIGHT + LABEL_MARGIN;

/** 그림판 가장자리에서 이만큼 안쪽에 있어야 한다 */
const CANVAS_PAD = 4;
const COLUMN_TOP = CANVAS_PAD + LABEL_HEIGHT / 2;
const COLUMN_BOTTOM = DONUT_HEIGHT - CANVAS_PAD - LABEL_HEIGHT / 2;

export type LabelAnchor = "start" | "end";

export type Point = { x: number; y: number };

export type DonutArc = {
  virtue: VirtueCode;
  ratio: number;
  /** stroke-dasharray 의 앞 값 (그릴 길이) */
  length: number;
  /** stroke-dashoffset. 앞 조각들이 쓴 만큼 음수로 민다 */
  offset: number;
  label: {
    x: number;
    y: number;
    anchor: LabelAnchor;
    /** 조각에서 이름표까지 잇는 선. 꺾이는 점을 포함해 세 점이다 */
    leader: readonly [Point, Point, Point];
  };
};

/** 글자 수로 어림잡은 이름표 폭 */
export function labelWidth(nameKo: string, ratio: number): number {
  const glyphs = [...nameKo];
  const letters = glyphs.filter((ch) => ch !== " ").length;
  const spaces = glyphs.length - letters;
  const nameWidth = letters * NAME_SIZE + spaces * SPACE_WIDTH;
  const pctWidth = (`${ratio}`.length + 1) * (PCT_SIZE * 0.6);
  return Math.max(nameWidth, pctWidth);
}

/**
 * 한 줄에 선 이름표들을 위아래로 밀어 띄운다.
 *
 * 위에서 아래로 한 번 밀고, 아래 벽을 넘은 만큼 다시 위로 되민다.
 * 두 번이면 끝난다 — 이름표가 많아야 여섯이고 줄 높이가 넉넉하기 때문이다
 * (여섯이 한 줄에 다 몰려도 5 × 30 = 150 < 216).
 */
function spreadColumn(entries: { index: number; y: number }[]): void {
  entries.sort((a, b) => a.y - b.y);

  let floor = COLUMN_TOP;
  for (const entry of entries) {
    entry.y = Math.max(entry.y, floor);
    floor = entry.y + MIN_GAP;
  }

  let ceiling = COLUMN_BOTTOM;
  for (const entry of [...entries].reverse()) {
    entry.y = Math.min(entry.y, ceiling);
    ceiling = entry.y - MIN_GAP;
  }
}

/**
 * 비율 목록을 도넛 조각으로 바꾼다.
 *
 * 조각 차례는 받은 그대로 둔다. 덕목 고유 순서로 넘어오므로 조를 바꿔도
 * 조각이 자리를 옮기지 않고, 두 조의 모양을 견줄 수 있다.
 */
export function buildDonut(rows: readonly VirtueRatioRow[]): DonutArc[] {
  const circumference = 2 * Math.PI * DONUT_R;

  const slices = rows.map((row, index) => {
    const before = rows
      .slice(0, index)
      .reduce((sum, earlier) => sum + earlier.ratio, 0);

    // 12시에서 시작해 시계 방향. 조각 한가운데에 이름표를 건다
    const angle = (((before + row.ratio / 2) / 100) * 360 - 90) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      virtue: row.virtue,
      ratio: row.ratio,
      length: (row.ratio / 100) * circumference,
      offset: (before / 100) * circumference,
      /* 12시·6시 쪽(cos ≈ 0)은 어느 줄에 세워도 되므로 오른쪽으로 보낸다 */
      side: cos >= 0 ? ("right" as const) : ("left" as const),
      edge: { x: DONUT_CX + OUTER_R * cos, y: DONUT_CY + OUTER_R * sin },
      elbow: { x: DONUT_CX + ELBOW_R * cos, y: DONUT_CY + ELBOW_R * sin },
      /** 밀어내기 전, 조각이 원하는 높이 */
      idealY: DONUT_CY + ELBOW_R * sin,
    };
  });

  /*
    이름표는 조각 옆이 아니라 도넛 양옆 두 줄에 세운다.
    조각을 따라 비스듬히 놓으면 밀어냈을 때 도넛 위로 올라탄다.
  */
  const columnX = {
    right: DONUT_CX + OUTER_R + COLUMN_GAP,
    left: DONUT_CX - OUTER_R - COLUMN_GAP,
  };

  const byIndex = new Map<number, number>();
  for (const side of ["right", "left"] as const) {
    const entries = slices
      .map((slice, index) => ({ slice, index }))
      .filter(({ slice }) => slice.side === side)
      .map(({ slice, index }) => ({ index, y: slice.idealY }));

    spreadColumn(entries);
    for (const entry of entries) {
      byIndex.set(entry.index, entry.y);
    }
  }

  return slices.map((slice, index) => {
    const y = byIndex.get(index) ?? slice.idealY;
    const x = columnX[slice.side];
    const anchor: LabelAnchor = slice.side === "right" ? "start" : "end";
    // 선 끝이 글자에 닿지 않게 조금 앞에서 멈춘다
    const tip = slice.side === "right" ? x - 5 : x + 5;

    return {
      virtue: slice.virtue,
      ratio: slice.ratio,
      length: slice.length,
      offset: slice.offset,
      label: {
        x,
        y,
        anchor,
        leader: [slice.edge, slice.elbow, { x: tip, y }] as const,
      },
    };
  });
}

/** 이름표가 실제로 차지하는 네모. 겹침 검사와 테스트가 쓴다 */
export function labelBox(arc: DonutArc): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const width = labelWidth(VIRTUE_META[arc.virtue].nameKo, arc.ratio);
  return {
    x: arc.label.anchor === "start" ? arc.label.x : arc.label.x - width,
    y: arc.label.y - LABEL_HEIGHT / 2,
    width,
    height: LABEL_HEIGHT,
  };
}
