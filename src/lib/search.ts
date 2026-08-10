/**
 * 이름 검색.
 *
 * 명단은 많아야 수백 명이라 서버에 묻지 않고 브라우저에서 거른다.
 * 글자를 칠 때마다 왕복하면 오히려 느리다.
 *
 * 초성 검색을 같이 지원한다. 모임에서 이름을 찾을 때
 * "ㄱㅅㄱ" 처럼 자음만 치는 사람이 많기 때문이다.
 */

const HANGUL_FIRST = 0xac00; // '가'
const HANGUL_LAST = 0xd7a3; // '힣'
/** 초성 하나가 차지하는 음절 수 (중성 21 × 종성 28) */
const SYLLABLES_PER_CHOSEONG = 588;

const CHOSEONG: readonly string[] = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/**
 * 공백을 지우고 소문자로 맞춘다.
 * "곽 수경" 으로 저장된 이름을 "곽수경" 으로도 찾을 수 있어야 한다.
 */
export function normalizeName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

/** 한글 음절을 초성으로 바꾼다. 한글이 아닌 글자는 그대로 둔다 */
export function toChoseong(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code !== undefined && code >= HANGUL_FIRST && code <= HANGUL_LAST) {
      const index = Math.floor((code - HANGUL_FIRST) / SYLLABLES_PER_CHOSEONG);
      out += CHOSEONG[index] ?? char;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * 초성만으로 이루어진 질의인지.
 *
 * "ㄱㅅ" 은 초성 검색이고 "가" 는 아니다.
 * 초성이 될 수 없는 겹자음(ㄳ·ㄵ 등)은 여기서 걸러진다.
 */
function isChoseongQuery(value: string): boolean {
  return value.length > 0 && [...value].every((char) => CHOSEONG.includes(char));
}

/**
 * 이름이 질의에 걸리는지.
 *
 * 빈 질의는 전부 통과시킨다. 검색창을 비우면 목록이 다시 다 보여야 한다.
 */
export function matchesQuery(name: string, query: string): boolean {
  const needle = normalizeName(query);
  if (needle === "") {
    return true;
  }

  const haystack = normalizeName(name);
  if (haystack.includes(needle)) {
    return true;
  }

  // 이름을 초성으로 바꿔 다시 본다. 질의가 초성일 때만 한다.
  // 안 그러면 "가" 를 쳤을 때 "ㄱ" 으로 시작하는 이름이 전부 걸린다
  return isChoseongQuery(needle) && toChoseong(haystack).includes(needle);
}

/** 이름으로 거른다. 입력 배열을 바꾸지 않는다 */
export function filterByQuery<T extends { name: string }>(
  items: readonly T[],
  query: string,
): T[] {
  return items.filter((item) => matchesQuery(item.name, query));
}
