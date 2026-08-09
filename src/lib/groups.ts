import { UNASSIGNED_GROUP_LABEL } from "./constants";

/**
 * 조 이름 처리.
 *
 * 조 목록은 people.group_name 의 DISTINCT 로 얻는다. 별도 테이블을 만들지 않는다.
 * group_name 이 null 인 사람은 '미지정' 으로 묶어 항상 맨 뒤에 둔다.
 */

type Chunk = { kind: "num"; value: number } | { kind: "text"; value: string };

/** "10조" → [10, "조"] 처럼 숫자와 글자를 번갈아 자른다 */
function toChunks(input: string): Chunk[] {
  const matches = input.match(/\d+|\D+/g);
  if (matches === null) {
    return [];
  }
  return matches.map((part) =>
    /^\d+$/.test(part)
      ? { kind: "num", value: Number(part) }
      : { kind: "text", value: part },
  );
}

/**
 * 자연 정렬 비교.
 * 문자열 정렬을 그대로 쓰면 "10조" 가 "2조" 앞에 오기 때문에 필요하다.
 * 숫자 덩어리는 숫자로, 글자 덩어리는 한국어 로케일로 비교한다.
 */
export function compareNatural(a: string, b: string): number {
  const left = toChunks(a);
  const right = toChunks(b);
  const length = Math.min(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const x = left[i];
    const y = right[i];
    if (x === undefined || y === undefined) {
      break;
    }

    if (x.kind === "num" && y.kind === "num") {
      if (x.value !== y.value) {
        return x.value - y.value;
      }
      continue;
    }

    if (x.kind === "text" && y.kind === "text") {
      const compared = x.value.localeCompare(y.value, "ko");
      if (compared !== 0) {
        return compared;
      }
      continue;
    }

    // 종류가 다르면 숫자로 시작하는 쪽을 앞에 둔다
    return x.kind === "num" ? -1 : 1;
  }

  return left.length - right.length;
}

/**
 * 조 이름을 자연 정렬한다. '미지정' 은 언제나 마지막.
 * 입력 배열을 바꾸지 않는다.
 */
export function sortGroupNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const aUnassigned = a === UNASSIGNED_GROUP_LABEL;
    const bUnassigned = b === UNASSIGNED_GROUP_LABEL;
    if (aUnassigned || bUnassigned) {
      if (aUnassigned && bUnassigned) {
        return 0;
      }
      return aUnassigned ? 1 : -1;
    }
    return compareNatural(a, b);
  });
}

/** null 인 조 이름을 표시용 라벨로 바꾼다 */
export function toGroupLabel(groupName: string | null): string {
  return groupName === null || groupName.trim() === ""
    ? UNASSIGNED_GROUP_LABEL
    : groupName;
}

/** 사람 목록에서 조 목록을 뽑아 정렬한다 */
export function collectGroupNames(
  people: ReadonlyArray<{ groupName: string | null }>,
): string[] {
  const seen = new Set<string>();
  for (const person of people) {
    seen.add(toGroupLabel(person.groupName));
  }
  return sortGroupNames([...seen]);
}
