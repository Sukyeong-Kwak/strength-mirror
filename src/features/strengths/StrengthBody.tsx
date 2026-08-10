import { findStrength, VIRTUE_META, type StrengthDef } from "@/lib/strengths";

/**
 * 강점 설명 본문.
 *
 * 시트(고르는 중)와 목록 화면(/strengths)이 같은 본문을 쓴다.
 * 두 벌로 두면 문구가 갈라진다.
 *
 * 클라이언트 지시자를 붙이지 않는다. 서버 화면에서도 그대로 쓰기 위해서다.
 *
 * 헷갈리기 쉬운 강점을 같이 보여주는 이유는, 비슷해 보이는 둘 중
 * 무엇을 고를지가 실제로 가장 자주 막히는 지점이기 때문이다.
 */
export function StrengthBody({ strength }: { strength: StrengthDef }) {
  const meta = VIRTUE_META[strength.virtue];

  return (
    <div>
      <p className={`text-sm ${meta.textClass}`}>
        {meta.nameKo} · {strength.nameEn}
      </p>

      <p className="mt-3 text-base leading-relaxed">{strength.long}</p>

      <div className="mt-4 rounded-base border border-line bg-page px-4 py-3">
        <p className="text-sm text-muted">이런 모습이 보이면</p>
        <p className="mt-1 text-base leading-relaxed">{strength.example}</p>
      </div>

      {strength.confusableWith.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted">헷갈리기 쉬운 강점</p>
          <ul className="mt-2 flex flex-col gap-2">
            {strength.confusableWith.map((code) => {
              const other = findStrength(code);
              if (other === null) {
                return null;
              }
              return (
                <li
                  key={code}
                  className="rounded-base border border-line px-3 py-2 text-sm"
                >
                  <span className="font-display">{other.nameKo}</span>
                  <span className="text-muted"> · {other.short}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
