/**
 * 받은 강점을 다시 읽는 계산들 — "유독 많이 보인 강점", "결이 비슷한 사람" 같은 것.
 *
 * 전부 순수 함수다. 재료는 서버가 내려주는 5% 눈금의 비율뿐이다. 누가 남겼는지는 어디에도 없고, 여기서도 만들지 않는다.
 *
 * 비율 행의 뜻 (ratio.ts 와 같다)
 *   - 행이 있고 ratio > 0  : 받았다
 *   - 행이 있고 ratio = 0  : 받았지만 5% 에 못 미친다
 *   - 행이 없다             : 아무도 고르지 않았다
 */

import { groupByVirtue } from "./ratio";
import {
  STRENGTHS,
  getStrength,
  type StrengthCode,
  type StrengthDef,
  type VirtueCode,
} from "./strengths";

import type { ReasonEntry, StrengthRatioRow } from "@/types/domain";

/** 사람 id → 그 사람이 받은 강점 비율 */
export type PersonRatios = ReadonlyMap<string, readonly StrengthRatioRow[]>;

/** 같은 비율이면 VIA 표의 차례로. 새로 고칠 때마다 자리가 바뀌지 않게 한다 */
function byRatioThenOrder(a: StrengthRatioRow, b: StrengthRatioRow): number {
  return b.ratio === a.ratio
    ? getStrength(a.strengthCode).order - getStrength(b.strengthCode).order
    : b.ratio - a.ratio;
}

function ratioOf(rows: readonly StrengthRatioRow[], code: StrengthCode): number {
  return rows.find((row) => row.strengthCode === code)?.ratio ?? 0;
}

/** 가장 많이 받은 강점 몇 개. 5% 에 못 미친 것은 빼고, 다 못 미치면 받은 것 그대로 */
export function topStrengths(
  rows: readonly StrengthRatioRow[],
  limit = 3,
): StrengthRatioRow[] {
  const sorted = [...rows].sort(byRatioThenOrder);
  const visible = sorted.filter((row) => row.ratio > 0);
  return (visible.length > 0 ? visible : sorted).slice(0, limit);
}

// ------------------------------------------------------------
// 1. 유독 많이 보인 강점
// ------------------------------------------------------------

export type Distinctive = {
  code: StrengthCode;
  /** 이 사람이 받은 비율 */
  mine: number;
  /** 비교 대상(보통 전체)의 비율 */
  everyone: number;
};

/**
 * 많이 받은 순이 아니라, 비교 대상보다 이 사람에게서 더 많이 보인 순.
 *
 * 친절처럼 모두가 많이 받는 강점은 순위표 맨 위에 늘 앉아 있어서
 * 그 사람다움을 말해주지 못한다. 차이가 클수록 그 사람에게서 유독 보인 것이다.
 */
export function distinctiveStrengths(
  mine: readonly StrengthRatioRow[],
  everyone: readonly StrengthRatioRow[],
  limit = 3,
): Distinctive[] {
  return mine
    .filter((row) => row.ratio > 0)
    .map((row) => ({
      code: row.strengthCode,
      mine: row.ratio,
      everyone: ratioOf(everyone, row.strengthCode),
    }))
    .filter((d) => d.mine > d.everyone)
    .sort((a, b) => {
      const gap = b.mine - b.everyone - (a.mine - a.everyone);
      if (gap !== 0) {
        return gap;
      }
      if (b.mine !== a.mine) {
        return b.mine - a.mine;
      }
      return getStrength(a.code).order - getStrength(b.code).order;
    })
    .slice(0, limit);
}

// ------------------------------------------------------------
// 2. 강점 카드의 한 줄
// ------------------------------------------------------------

const QUOTE_IDEAL_LENGTH = 60;
const QUOTE_MAX_LENGTH = 90;

/**
 * 그 강점에 남겨진 이야기 중 카드에 실을 한 줄.
 *
 * 너무 짧으면 맥락이 없고 너무 길면 카드가 넘친다. 60자 가까운 것을 고르고,
 * 같으면 최근 것. 고를 때마다 바뀌지 않도록 무작위로 뽑지 않는다.
 */
export function pickQuote(
  reasons: readonly ReasonEntry[],
  code: StrengthCode,
): string | null {
  const candidates = reasons.filter((entry) => entry.strengthCode === code);
  if (candidates.length === 0) {
    return null;
  }
  const best = [...candidates].sort((a, b) => {
    const da = Math.abs(a.reason.trim().length - QUOTE_IDEAL_LENGTH);
    const db = Math.abs(b.reason.trim().length - QUOTE_IDEAL_LENGTH);
    return da === db ? b.createdAt.localeCompare(a.createdAt) : da - db;
  })[0];
  if (best === undefined) {
    return null;
  }
  const text = best.reason.trim().replace(/\s+/g, " ");
  return text.length > QUOTE_MAX_LENGTH ? `${text.slice(0, QUOTE_MAX_LENGTH)}…` : text;
}

// ------------------------------------------------------------
// 3. 결이 비슷한 사람 · 서로 채워주는 사람
// ------------------------------------------------------------

function toVector(rows: readonly StrengthRatioRow[]): number[] {
  return STRENGTHS.map((s) => ratioOf(rows, s.code));
}

function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

export type SimilarPerson = {
  personId: string;
  /** 0~1. 받은 강점의 모양이 얼마나 닮았는지 */
  score: number;
  /** 둘 다 많이 받은 강점. 덜 받은 쪽 기준으로 큰 순 */
  shared: StrengthCode[];
};

/** 받은 강점의 모양(24칸 비율)이 가장 닮은 사람들 */
export function similarPeople(
  meId: string,
  all: PersonRatios,
  limit = 2,
): SimilarPerson[] {
  const mine = all.get(meId);
  if (mine === undefined) {
    return [];
  }
  const myVector = toVector(mine);

  const out: SimilarPerson[] = [];
  for (const [personId, rows] of all) {
    if (personId === meId) {
      continue;
    }
    const score = cosine(myVector, toVector(rows));
    if (score <= 0) {
      continue;
    }
    const shared = STRENGTHS.map((s) => ({
      code: s.code,
      both: Math.min(ratioOf(mine, s.code), ratioOf(rows, s.code)),
    }))
      .filter((x) => x.both > 0)
      .sort((a, b) => b.both - a.both)
      .slice(0, 3)
      .map((x) => x.code);
    out.push({ personId, score, shared });
  }

  return out
    .sort((a, b) => (b.score === a.score ? a.personId.localeCompare(b.personId) : b.score - a.score))
    .slice(0, limit);
}

export type ComplementPerson = {
  personId: string;
  /** 그 사람은 많이 받았는데 나는 아직 한 번도 받지 않은 강점 */
  brings: StrengthCode[];
};

/**
 * 나에게 없는 강점을 많이 가진 사람들. 퍼즐로 치면 옆 조각이다.
 *
 * 내가 한 번도 받지 않은 강점에 그 사람이 받은 비율을 더해 점수로 삼는다.
 * 같으면 덜 닮은 쪽을 앞에 둔다. 닮은 사람 목록에 이미 나온 사람은 뺀다.
 */
export function complementPeople(
  meId: string,
  all: PersonRatios,
  exclude: ReadonlySet<string> = new Set(),
  limit = 2,
): ComplementPerson[] {
  const mine = all.get(meId);
  if (mine === undefined) {
    return [];
  }
  const myCodes = new Set(mine.map((row) => row.strengthCode));
  const myVector = toVector(mine);

  const scored: Array<ComplementPerson & { gain: number; score: number }> = [];
  for (const [personId, rows] of all) {
    if (personId === meId || exclude.has(personId)) {
      continue;
    }
    const missing = [...rows]
      .filter((row) => row.ratio > 0 && !myCodes.has(row.strengthCode))
      .sort(byRatioThenOrder);
    const gain = missing.reduce((sum, row) => sum + row.ratio, 0);
    if (gain === 0) {
      continue;
    }
    scored.push({
      personId,
      brings: missing.slice(0, 3).map((row) => row.strengthCode),
      gain,
      score: cosine(myVector, toVector(rows)),
    });
  }

  return scored
    .sort((a, b) => {
      if (b.gain !== a.gain) {
        return b.gain - a.gain;
      }
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.personId.localeCompare(b.personId);
    })
    .slice(0, limit)
    .map(({ personId, brings }) => ({ personId, brings }));
}

// ------------------------------------------------------------
// 4. 조마다의 결
// ------------------------------------------------------------

export type GroupProfile = {
  groupName: string;
  /** 가장 많이 받은 덕목. 받은 것이 없으면 null */
  topVirtue: VirtueCode | null;
  topVirtueRatio: number;
  /** 스물네 가지 중 조 안에서 한 번이라도 나온 강점 수 */
  covered: number;
  top: StrengthCode[];
  /** 전체보다 이 조에서 유독 많이 보인 강점 하나 */
  distinctive: StrengthCode | null;
};

export function groupProfiles(
  byGroup: ReadonlyMap<string, readonly StrengthRatioRow[]>,
  overall: readonly StrengthRatioRow[],
): GroupProfile[] {
  const out: GroupProfile[] = [];
  for (const [groupName, rows] of byGroup) {
    if (rows.length === 0) {
      continue;
    }
    const virtue = groupByVirtue(rows)[0];
    const hasVirtue = virtue !== undefined && virtue.subtotal > 0;
    out.push({
      groupName,
      topVirtue: hasVirtue ? virtue.virtue : null,
      topVirtueRatio: hasVirtue ? virtue.subtotal : 0,
      covered: rows.length,
      top: topStrengths(rows, 3).map((row) => row.strengthCode),
      distinctive: distinctiveStrengths(rows, overall, 1)[0]?.code ?? null,
    });
  }
  return out;
}

// ------------------------------------------------------------
// 5. 아직 숨은 강점
// ------------------------------------------------------------

export type HiddenStrengths = {
  /** 아직 아무도 고르지 않은 강점 */
  untouched: StrengthDef[];
  /** 나오긴 했지만 5% 에 못 미치는 강점 */
  rare: StrengthDef[];
};

export function hiddenStrengths(rows: readonly StrengthRatioRow[]): HiddenStrengths {
  const byCode = new Map(rows.map((row) => [row.strengthCode, row.ratio]));
  const untouched: StrengthDef[] = [];
  const rare: StrengthDef[] = [];
  for (const s of STRENGTHS) {
    const ratio = byCode.get(s.code);
    if (ratio === undefined) {
      untouched.push(s);
    } else if (ratio === 0) {
      rare.push(s);
    }
  }
  return { untouched, rare };
}
