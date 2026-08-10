import type {
  StrengthRatioRow,
  VirtueGroup,
  VirtueRatioRow,
} from "@/types/domain";

import { VIRTUES, VIRTUE_META, type VirtueCode } from "./strengths";

/**
 * 비율 계산 · 그룹핑 · 정렬.
 *
 * 전부 순수 함수다. 컴포넌트 안에 인라인으로 쓰지 않는다.
 * 서버가 내려주는 것은 정수 퍼센트뿐이고, 건수는 애초에 존재하지 않는다.
 *
 * 비율은 DB 에서 이미 5% 눈금(20칸 최대잔여법)에 맞춰 내려온다.
 * 전부 5의 배수이고 합은 정확히 100 이다. 여기서 다시 반올림하지 않는다.
 */

/** 비율 내림차순. 같은 값이면 원래 순서를 유지한다 */
export function sortByRatioDesc<T extends { ratio: number }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => b.ratio - a.ratio);
}

/** 0% 는 막대로 그리지 않는다 (7-1) */
export function excludeZeroRatio<T extends { ratio: number }>(
  rows: readonly T[],
): T[] {
  return rows.filter((row) => row.ratio > 0);
}

/**
 * 막대로 그릴 것과 이름만 언급할 것으로 가른다.
 *
 * 5% 눈금을 쓰면 적게 받은 강점이 0% 로 내려앉는다.
 * 그렇다고 화면에서 지워버리면 누군가 골라준 강점이 흔적도 없이 사라진다.
 * 그래서 0% 는 막대 대신 이름만 모아 "이런 강점도 받았어요" 로 보여준다.
 *
 * 아예 선택되지 않은 강점은 서버가 행 자체를 내려주지 않으므로 여기 오지 않는다.
 */
export function splitByVisibility<T extends { ratio: number }>(
  rows: readonly T[],
): { charted: T[]; mentioned: T[] } {
  const charted: T[] = [];
  const mentioned: T[] = [];

  for (const row of rows) {
    if (row.ratio > 0) {
      charted.push(row);
    } else {
      mentioned.push(row);
    }
  }

  return { charted: sortByRatioDesc(charted), mentioned };
}

export function sumRatio(rows: readonly { ratio: number }[]): number {
  return rows.reduce((total, row) => total + row.ratio, 0);
}

/**
 * 강점 행을 덕목 6개 섹션으로 묶는다.
 *
 * 섹션 소계는 그 섹션에 속한 강점 비율의 합이다.
 * 별도 덕목 뷰의 값을 쓰지 않는 이유는, 헤더 숫자와 그 아래 막대들의 합이
 * 어긋나 보이지 않게 하기 위해서다.
 *
 * 소계가 0인 덕목도 빠뜨리지 않고 반환한다. 화면에서 접거나 "아직 없음" 으로 처리한다.
 */
export function groupByVirtue(rows: readonly StrengthRatioRow[]): VirtueGroup[] {
  const buckets = new Map<VirtueCode, StrengthRatioRow[]>(
    VIRTUES.map((virtue) => [virtue, []]),
  );

  for (const row of rows) {
    buckets.get(row.virtue)?.push(row);
  }

  const groups: VirtueGroup[] = VIRTUES.map((virtue) => {
    const bucket = buckets.get(virtue) ?? [];
    const sorted = sortByRatioDesc(bucket);
    return {
      virtue,
      meta: VIRTUE_META[virtue],
      subtotal: sumRatio(sorted),
      rows: sorted,
    };
  });

  // 소계 내림차순. 같으면 덕목 고유 순서대로 둬서 화면이 흔들리지 않게 한다
  return groups.sort((a, b) =>
    b.subtotal === a.subtotal
      ? a.meta.order - b.meta.order
      : b.subtotal - a.subtotal,
  );
}

/**
 * 스택 막대에 쓸 덕목 구간.
 *
 * 0% 구간은 렌더링하지 않고, 남은 구간은 덕목 고유 순서대로 둔다.
 * 서버에서 이미 합이 100이 되도록 내려오므로 여기서 다시 보정하지 않는다.
 */
export function toVirtueSegments(
  rows: readonly VirtueRatioRow[],
): VirtueRatioRow[] {
  const byVirtue = new Map<VirtueCode, number>();
  for (const row of rows) {
    byVirtue.set(row.virtue, (byVirtue.get(row.virtue) ?? 0) + row.ratio);
  }

  return VIRTUES.map((virtue) => ({
    virtue,
    ratio: byVirtue.get(virtue) ?? 0,
  })).filter((segment) => segment.ratio > 0);
}
