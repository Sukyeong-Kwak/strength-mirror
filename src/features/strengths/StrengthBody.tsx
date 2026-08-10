import { josa } from "@/lib/korean";
import { findStrength, VIRTUE_META, type StrengthDef } from "@/lib/strengths";

/**
 * 강점 설명 본문.
 *
 * 시트(고르는 중)와 목록 화면(/strengths)이 같은 본문을 쓴다.
 * 두 벌로 두면 문구가 갈라진다.
 *
 * 클라이언트 지시자를 붙이지 않는다. 서버 화면에서도 그대로 쓰기 위해서다.
 *
 * 읽는 순서를 좁은 것에서 넓은 것으로 둔다.
 *   무슨 뜻인가 → VIA 는 뭐라고 하나 → 실제로 어떤 모습인가 → 비슷한 것과 뭐가 다른가
 * 마지막 두 칸이 가장 자주 막히는 지점이다.
 */
export function StrengthBody({ strength }: { strength: StrengthDef }) {
  const meta = VIRTUE_META[strength.virtue];
  const others = strength.confusableWith
    .map(findStrength)
    .filter((other): other is StrengthDef => other !== null);

  // "호기심과 무엇이 다른가요" — 앞말 받침에 따라 조사가 달라진다
  const distinctionTitle =
    others.length === 1 && others[0] !== undefined
      ? `${others[0].nameKo}${josa(others[0].nameKo, "와/과")} 무엇이 다른가요`
      : others.length > 1
        ? "비슷한 강점과 무엇이 다른가요"
        : "이런 뜻은 아니에요";

  // "독창성 · 기발함이라고도 해요" — 마지막 낱말 받침에 조사를 맞춘다
  const lastAlias = strength.alsoCalled.at(-1) ?? "";

  return (
    <div>
      {/*
        덕목과 영문 이름은 위계가 다르다.
        "지혜와 지식 · Creativity" 처럼 가운뎃점으로 이으면 둘이 같은 층으로 읽혀서,
        Creativity 가 덕목 이름인지 강점 이름인지 헷갈린다.
        덕목은 분류라서 테두리 있는 칩으로, 영문 이름은 이 강점에 딸린 것이라
        아래 줄에 무엇인지 적어서 낮춘다.
      */}
      <p>
        <span
          className={`inline-block rounded-base border px-2 py-1 text-xs ${meta.chipClass}`}
        >
          {meta.nameKo}
        </span>
      </p>

      <p className="mt-2 text-sm text-muted">
        영문 이름 <span className="text-ink">{strength.nameEn}</span>
      </p>

      {strength.alsoCalled.length > 0 && (
        <p className="mt-1 text-sm text-muted">
          {strength.alsoCalled.join(" · ")}
          {josa(lastAlias, "이라고/라고")}도 해요
        </p>
      )}

      <p className="mt-3 text-base leading-relaxed">{strength.long}</p>

      <div className="mt-4 rounded-base border border-line bg-page px-4 py-3">
        <p className="text-sm text-muted">VIA 분류에서는</p>
        <p className="mt-1 text-base leading-relaxed">{strength.viaDefinition}</p>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted">이런 모습이 보이면</p>
        <ul className="mt-2 flex flex-col gap-2">
          {strength.examples.map((example) => (
            <li
              key={example}
              className="rounded-base border border-line px-3 py-2 text-base leading-relaxed"
            >
              {example}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted">{distinctionTitle}</p>
        <p className="mt-1 text-base leading-relaxed">{strength.distinction}</p>
        {others.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {others.map((other) => (
              <li
                key={other.code}
                className="rounded-base border border-line px-3 py-2 text-sm"
              >
                <span className="font-display">{other.nameKo}</span>
                <span className="text-muted"> · {other.short}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
