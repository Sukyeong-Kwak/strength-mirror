import Link from "next/link";

import type { Distinctive } from "@/lib/insights";
import { VIRTUE_META, getStrength } from "@/lib/strengths";

type DistinctiveListProps = {
  /** 비교하는 쪽의 이름. "민지님" · "1조" */
  subject: string;
  items: readonly Distinctive[];
};

/**
 * 유독 많이 보인 강점.
 *
 * 막대 두 줄로 견준다. 위가 이 사람, 아래가 모두.
 * 숫자만 나란히 두면 차이가 계산 문제가 되고, 막대로 두면 눈이 먼저 안다.
 */
export function DistinctiveList({ subject, items }: DistinctiveListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const strength = getStrength(item.code);
        const meta = VIRTUE_META[strength.virtue];
        return (
          <li key={item.code} className="rounded-base border border-line bg-surface px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/strengths/${item.code}`}
                className="font-display text-lg underline-offset-4 hover:underline"
              >
                {strength.nameKo}
              </Link>
              <span className={`text-sm ${meta.textClass}`}>{meta.nameKo}</span>
            </div>
            <dl className="mt-2 grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-x-2 gap-y-1 text-sm">
              <dt className="truncate text-ink">{subject}</dt>
              <dd className="h-2 rounded-full bg-line/40">
                <div
                  className={`h-2 rounded-full ${meta.barClass}`}
                  style={{ width: `${item.mine}%` }}
                />
              </dd>
              <dd className="num text-right">{item.mine}%</dd>
              <dt className="text-muted">모두</dt>
              <dd className="h-2 rounded-full bg-line/40">
                <div
                  className="h-2 rounded-full bg-muted/50"
                  style={{ width: `${item.everyone}%` }}
                />
              </dd>
              <dd className="num text-right text-muted">{item.everyone}%</dd>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
