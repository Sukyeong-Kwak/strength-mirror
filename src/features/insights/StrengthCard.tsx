import { VIRTUE_META, getStrength, type StrengthCode } from "@/lib/strengths";

export type CardStrength = {
  code: StrengthCode;
  ratio: number;
  /** 그 강점에 남겨진 이야기 한 줄 */
  quote: string | null;
};

type StrengthCardProps = {
  name: string;
  groupLabel: string;
  top: readonly CardStrength[];
  /** 모두와 견줘 유독 많이 보인 강점 */
  distinctive: StrengthCode | null;
  size?: "compact" | "large";
};

/**
 * 한 장짜리 강점 카드.
 *
 * 결과 화면 맨 위의 요약과 크게 보기(/p/[id]/card)가 같은 카드를 쓴다.
 * 캡처해서 간직하는 것을 염두에 두고, 카드 하나만 잘려 나가도 누구의 무엇인지
 * 알 수 있게 이름과 조를 카드 안에 넣는다.
 */
export function StrengthCard({
  name,
  groupLabel,
  top,
  distinctive,
  size = "compact",
}: StrengthCardProps) {
  const large = size === "large";

  return (
    <article
      className={`rounded-base border border-line bg-surface ${large ? "p-6 sm:p-8" : "p-5"}`}
    >
      <p className="text-sm text-muted">{groupLabel}</p>
      <p className={`font-display ${large ? "text-3xl" : "text-2xl"}`}>{name}</p>
      <p className="mt-1 text-sm text-muted">곁에 있는 사람들 눈에 가장 많이 보인 강점</p>

      <ol className={`flex flex-col ${large ? "mt-6 gap-6" : "mt-4 gap-4"}`}>
        {top.map((item) => {
          const strength = getStrength(item.code);
          const meta = VIRTUE_META[strength.virtue];
          return (
            <li
              key={item.code}
              className="border-l-4 pl-3"
              style={{ borderColor: `var(${meta.colorVar})` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-display ${large ? "text-xl" : "text-lg"}`}>
                  {strength.nameKo}
                </span>
                {item.ratio > 0 && (
                  <span className="num shrink-0 text-sm text-muted">{item.ratio}%</span>
                )}
              </div>
              <p className={`text-sm ${meta.textClass}`}>{meta.nameKo}</p>
              {item.quote !== null && (
                <p className="mt-1 text-base leading-relaxed">“{item.quote}”</p>
              )}
            </li>
          );
        })}
      </ol>

      {distinctive !== null && (
        <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
          모두와 견줘 유독 많이 보인 강점 ·{" "}
          <span className="font-display text-base text-ink">
            {getStrength(distinctive).nameKo}
          </span>
        </p>
      )}
    </article>
  );
}
