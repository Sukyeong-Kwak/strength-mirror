/**
 * 강점 설명에 붙는 머리말 — 화면(StrengthBody)과 PDF 가 같은 말을 쓰게 한 곳에 둔다.
 * 두 벌로 두면 문구가 갈라진다.
 */

import { josa } from "./korean";
import { findStrength, type StrengthDef } from "./strengths";

/** 헷갈리기 쉬운 강점들 */
export function confusables(strength: StrengthDef): StrengthDef[] {
  return strength.confusableWith
    .map(findStrength)
    .filter((other): other is StrengthDef => other !== null);
}

/** "호기심과 무엇이 다른가요" — 앞말 받침에 따라 조사가 달라진다 */
export function distinctionTitle(strength: StrengthDef): string {
  const others = confusables(strength);
  const [only] = others;
  if (others.length === 1 && only !== undefined) {
    return `${only.nameKo}${josa(only.nameKo, "와/과")} 무엇이 다른가요`;
  }
  return others.length > 1 ? "비슷한 강점과 무엇이 다른가요" : "이런 뜻은 아니에요";
}

/** "독창성 · 기발함이라고도 해요" — 마지막 낱말 받침에 조사를 맞춘다. 다른 이름이 없으면 null */
export function alsoCalledLine(strength: StrengthDef): string | null {
  const last = strength.alsoCalled.at(-1);
  if (last === undefined) {
    return null;
  }
  return `${strength.alsoCalled.join(" · ")}${josa(last, "이라고/라고")}도 해요`;
}
