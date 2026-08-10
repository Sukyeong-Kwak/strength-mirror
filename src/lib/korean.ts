/**
 * 조사 고르기.
 *
 * "호기심과" 와 "용서와" 처럼 앞말 받침에 따라 조사가 달라진다.
 * 화면에 강점 이름을 넣어 문장을 만들 때 필요하다.
 * "호기심와" 같은 글자가 한 번 보이면 나머지 문장까지 대충 쓴 것처럼 읽힌다.
 */

const HANGUL_FIRST = 0xac00; // '가'
const HANGUL_LAST = 0xd7a3; // '힣'
/** 한 초성이 차지하는 음절 수. 나머지가 0 이면 받침이 없다 */
const SYLLABLES_PER_CHOSEONG = 28;

/**
 * 마지막 글자에 받침이 있는지.
 * 한글이 아닌 글자로 끝나면 받침이 없는 것으로 본다 (영문·숫자).
 */
export function hasFinalConsonant(word: string): boolean {
  const last = word.trim().at(-1);
  const code = last?.codePointAt(0);
  if (code === undefined || code < HANGUL_FIRST || code > HANGUL_LAST) {
    return false;
  }
  return (code - HANGUL_FIRST) % SYLLABLES_PER_CHOSEONG !== 0;
}

/** [받침 있을 때, 없을 때] */
const PARTICLES = {
  "와/과": ["과", "와"],
  "은/는": ["은", "는"],
  "이/가": ["이", "가"],
  "을/를": ["을", "를"],
  /** "기발함이라고도" · "지혜라고도" */
  "이라고/라고": ["이라고", "라고"],
} as const;

export type ParticlePair = keyof typeof PARTICLES;

/** 앞말에 맞는 조사를 돌려준다. 낱말은 붙이지 않는다 */
export function josa(word: string, pair: ParticlePair): string {
  const [withFinal, withoutFinal] = PARTICLES[pair];
  return hasFinalConsonant(word) ? withFinal : withoutFinal;
}
