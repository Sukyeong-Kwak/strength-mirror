import Link from "next/link";

import { getStrength, type StrengthCode } from "@/lib/strengths";

export type MatchEntry = {
  personId: string;
  name: string;
  groupLabel: string;
  strengths: readonly StrengthCode[];
};

type MatchListProps = {
  title: string;
  description: string;
  /** 강점 줄 앞에 붙는 말 */
  strengthsLabel: string;
  entries: readonly MatchEntry[];
};

function MatchList({ title, description, strengthsLabel, entries }: MatchListProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <div>
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.personId}>
            <Link
              href={`/p/${entry.personId}/result`}
              className="block h-full rounded-base border border-line bg-surface px-4 py-3"
            >
              <span className="font-display text-base">{entry.name}</span>
              <span className="ml-2 text-sm text-muted">{entry.groupLabel}</span>
              <span className="mt-1 block text-sm text-muted">
                {strengthsLabel} ·{" "}
                <span className="text-ink">
                  {entry.strengths.map((code) => getStrength(code).nameKo).join(", ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PeopleMatchesProps = {
  subject: string;
  similar: readonly MatchEntry[];
  complement: readonly MatchEntry[];
};

/** 결이 비슷한 사람 · 서로 채워주는 사람 */
export function PeopleMatches({ subject, similar, complement }: PeopleMatchesProps) {
  return (
    <div className="flex flex-col gap-6">
      <MatchList
        title="결이 비슷한 사람"
        description="주신 강점의 모양이 닮았어요."
        strengthsLabel="함께 많이 발견된 강점"
        entries={similar}
      />
      <MatchList
        title="서로 채워주는 사람"
        description={`${subject}에게서 아직 발견되지 않은 강점이 많이 보인 사람이에요. 서로 다른 강점을 주셔서, 퍼즐의 옆 조각처럼 함께 채워가요.`}
        strengthsLabel="이분에게서 많이 보인 강점"
        entries={complement}
      />
    </div>
  );
}
