/**
 * 덕목 도넛의 조각과 이름표 자리.
 *
 * 이름표를 도넛 밖에 줄줄이 늘어놓지 않고 조각 옆에 붙인다. 색과 이름을
 * 눈으로 잇는 일(범례 왕복)이 사라지면 그림 하나만 보면 된다.
 *
 * 대신 자리가 모자란다. 조각이 작으면 그 옆 이름표가 이웃 이름표와 겹친다.
 * 겹치는 것은 접고(hidden), 접은 것은 조각에 손을 올리면 나온다.
 * 큰 조각부터 자리를 잡는다 — 접히더라도 작은 쪽이 접혀야 한다.
 *
 * 글자 폭은 재지 않고 글자 수로 어림잡는다. 서버에서 그리는 그림이라
 * 실제 폭을 알 방법이 없다. 넉넉하게 잡아서 겹치느니 접히는 쪽으로 기운다.
 *
 * 좌표는 전부 viewBox 단위다. 화면 크기와 무관하게 같은 이름표가 나온다.
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

/** 이름표가 앉는 반지름. 고리 바깥에 둔다 */
const LABEL_R = DONUT_R + DONUT_STROKE / 2 + 12;

/** 어림잡는 글자 폭 (viewBox 단위) */
const NAME_SIZE = 12;
const PCT_SIZE = 11;
const SPACE_WIDTH = 4;

/** 이름표 한 덩이의 높이 — 이름 한 줄과 퍼센트 한 줄 */
const LABEL_HEIGHT = 26;
/** 이름표끼리 이만큼은 떨어져 있어야 붙어 보이지 않는다 */
const LABEL_MARGIN = 2;
/** 그림판 가장자리에서 이만큼 안쪽에 있어야 한다 */
const CANVAS_PAD = 4;

/**
 * 세로에 가까운 자리에서는 가운데 정렬로 둔다.
 * 12시·6시 쪽 이름표를 한쪽으로 붙이면 도넛이 기울어 보인다.
 */
const MIDDLE_ANCHOR_COS = 0.2;

export type LabelAnchor = "start" | "middle" | "end";

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
    /** 이름표 뒤에 깔 판. 접힌 이름표가 조각 위로 나올 때 쓴다 */
    box: { x: number; y: number; width: number; height: number };
    /** 자리가 없어 접었다. 조각에 손을 올려야 나온다 */
    hidden: boolean;
  };
};

/** 글자 수로 어림잡은 이름표 폭 */
function labelWidth(nameKo: string, ratio: number): number {
  const letters = [...nameKo].filter((ch) => ch !== " ").length;
  const spaces = [...nameKo].length - letters;
  const nameWidth = letters * NAME_SIZE + spaces * SPACE_WIDTH;
  const pctWidth = (`${ratio}`.length + 1) * (PCT_SIZE * 0.6);
  return Math.max(nameWidth, pctWidth);
}

type Box = { x: number; y: number; width: number; height: number };

function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width + LABEL_MARGIN &&
    b.x < a.x + a.width + LABEL_MARGIN &&
    a.y < b.y + b.height + LABEL_MARGIN &&
    b.y < a.y + a.height + LABEL_MARGIN
  );
}

function insideCanvas(box: Box): boolean {
  return (
    box.x >= CANVAS_PAD &&
    box.y >= CANVAS_PAD &&
    box.x + box.width <= DONUT_WIDTH - CANVAS_PAD &&
    box.y + box.height <= DONUT_HEIGHT - CANVAS_PAD
  );
}

/**
 * 비율 목록을 도넛 조각으로 바꾼다.
 *
 * 조각 차례는 받은 그대로 둔다. 덕목 고유 순서로 넘어오므로 조를 바꿔도
 * 조각이 자리를 옮기지 않고, 두 조의 모양을 견줄 수 있다.
 */
export function buildDonut(rows: readonly VirtueRatioRow[]): DonutArc[] {
  const circumference = 2 * Math.PI * DONUT_R;

  const placed = rows.map((row, index) => {
    const before = rows
      .slice(0, index)
      .reduce((sum, earlier) => sum + earlier.ratio, 0);

    // 12시에서 시작해 시계 방향. 조각 한가운데에 이름표를 건다
    const midRatio = before + row.ratio / 2;
    const angle = ((midRatio / 100) * 360 - 90) * (Math.PI / 180);
    const cos = Math.cos(angle);

    const x = DONUT_CX + LABEL_R * cos;
    const y = DONUT_CY + LABEL_R * Math.sin(angle);

    const anchor: LabelAnchor =
      Math.abs(cos) < MIDDLE_ANCHOR_COS ? "middle" : cos > 0 ? "start" : "end";

    const width = labelWidth(VIRTUE_META[row.virtue].nameKo, row.ratio);
    const box: Box = {
      x: anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2,
      y: y - LABEL_HEIGHT / 2,
      width,
      height: LABEL_HEIGHT,
    };

    return {
      virtue: row.virtue,
      ratio: row.ratio,
      length: (row.ratio / 100) * circumference,
      offset: (before / 100) * circumference,
      label: { x, y, anchor, box },
    };
  });

  /*
    큰 조각부터 자리를 맡는다. 앞선 이름표와 겹치거나 그림판을 벗어나면 접는다.
    같은 비율이면 먼저 온 덕목이 앞선다 — 그래야 같은 숫자에서 같은 그림이 나온다.
  */
  const priority = placed
    .map((arc, index) => ({ arc, index }))
    .sort((a, b) =>
      b.arc.ratio === a.arc.ratio ? a.index - b.index : b.arc.ratio - a.arc.ratio,
    );

  const taken: Box[] = [];
  const hidden = new Set<number>();

  for (const { arc, index } of priority) {
    const box = arc.label.box;
    if (!insideCanvas(box) || taken.some((other) => overlaps(box, other))) {
      hidden.add(index);
      continue;
    }
    taken.push(box);
  }

  return placed.map((arc, index) => ({
    ...arc,
    label: { ...arc.label, hidden: hidden.has(index) },
  }));
}
