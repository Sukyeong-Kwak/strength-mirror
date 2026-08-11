/**
 * 트리맵 배치 — 넓이가 값에 비례하는 사각형 나누기.
 *
 * 주식 히트맵과 같은 방식이다. 값이 큰 것이 큰 칸을 차지하고,
 * 모두 합치면 주어진 사각형을 빈틈없이 채운다.
 *
 * 순수 기하 계산만 한다. 덕목·강점 같은 것은 여기서 알지 못한다.
 * 도메인 쪽은 lib/heatmap.ts 에 있다.
 *
 * 알고리즘은 squarified treemap (Bruls·Huizing·van Wijk, 2000) 이다.
 * 값 순서대로 그냥 잘라 나가면(slice-and-dice) 칸이 실오라기처럼 길어져
 * 이름을 넣을 수 없다. 이 방식은 칸을 최대한 정사각형에 가깝게 유지한다.
 *
 * 단위는 부르는 쪽이 정한다. 화면에서는 "가로 = 종횡비, 세로 = 1" 인
 * 정규화 공간을 넘기고, 나온 사각형을 퍼센트로 바꿔 쓴다. 그래야
 * 종횡비가 계산에 반영돼 실제로 정사각형에 가까운 칸이 나온다.
 */

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TreemapInput<T> = {
  /** 넓이를 정하는 값. 0 이하는 배치하지 않는다 */
  value: number;
  datum: T;
};

export type TreemapTile<T> = Rect & {
  datum: T;
};

/** 한 줄에 놓인 칸들의 최악 종횡비. 1 에 가까울수록 정사각형에 가깝다 */
function worstAspect(areas: readonly number[], side: number): number {
  if (areas.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const area of areas) {
    sum += area;
    min = Math.min(min, area);
    max = Math.max(max, area);
  }

  if (sum <= 0 || side <= 0 || min <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  const sum2 = sum * sum;
  const side2 = side * side;
  return Math.max((side2 * max) / sum2, sum2 / (side2 * min));
}

/**
 * 한 줄을 짧은 변에 붙여 놓고, 남은 사각형을 돌려준다.
 *
 * 항상 짧은 변을 따라 놓는다. 긴 변에 붙이면 칸이 납작해진다.
 */
function placeRow<T>(
  row: readonly { area: number; datum: T }[],
  free: Rect,
  out: TreemapTile<T>[],
): Rect {
  const rowArea = row.reduce((total, item) => total + item.area, 0);

  // 가로가 더 길면 세로 한 줄(기둥)을 왼쪽에 세운다
  if (free.w >= free.h) {
    const width = free.h > 0 ? rowArea / free.h : 0;
    let y = free.y;
    for (const item of row) {
      const h = width > 0 ? item.area / width : 0;
      out.push({ x: free.x, y, w: width, h, datum: item.datum });
      y += h;
    }
    return { x: free.x + width, y: free.y, w: free.w - width, h: free.h };
  }

  const height = free.w > 0 ? rowArea / free.w : 0;
  let x = free.x;
  for (const item of row) {
    const w = height > 0 ? item.area / height : 0;
    out.push({ x, y: free.y, w, h: height, datum: item.datum });
    x += w;
  }
  return { x: free.x, y: free.y + height, w: free.w, h: free.h - height };
}

/**
 * 값에 비례하는 넓이로 사각형을 채운다.
 *
 * 값이 큰 순서로 넣어야 정사각형에 가깝게 나온다. 정렬은 부르는 쪽 몫이다.
 * 화면에 놓이는 차례가 곧 읽는 차례라 여기서 마음대로 바꾸지 않는다.
 */
export function squarify<T>(
  items: readonly TreemapInput<T>[],
  rect: Rect,
): TreemapTile<T>[] {
  const positive = items.filter((item) => item.value > 0);
  const total = positive.reduce((sum, item) => sum + item.value, 0);

  if (positive.length === 0 || total <= 0 || rect.w <= 0 || rect.h <= 0) {
    return [];
  }

  const rectArea = rect.w * rect.h;
  const scaled = positive.map((item) => ({
    area: (item.value / total) * rectArea,
    datum: item.datum,
  }));

  const tiles: TreemapTile<T>[] = [];
  let free: Rect = { ...rect };
  let row: typeof scaled = [];

  for (const next of scaled) {
    const side = Math.min(free.w, free.h);
    const areas = row.map((item) => item.area);

    // 이 칸을 더해서 모양이 나빠지면 지금까지의 줄을 놓고 새 줄을 시작한다
    if (
      row.length > 0 &&
      worstAspect([...areas, next.area], side) > worstAspect(areas, side)
    ) {
      free = placeRow(row, free, tiles);
      row = [];
    }

    row.push(next);
  }

  if (row.length > 0) {
    placeRow(row, free, tiles);
  }

  return tiles;
}
