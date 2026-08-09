import { MIN_STRENGTHS_PER_PERSON } from "@/lib/constants";
import { sortGroupNames } from "@/lib/groups";
import type { PersonTotals } from "@/types/domain";

type UnlockStatusCardProps = {
  unlocked: boolean;
  totals: readonly PersonTotals[];
};

/**
 * 결과 공개 상태.
 *
 * 일반 사용자 화면과 달리 관리자는 미달 인원의 이름을 봐야 한다.
 * 누구에게 강점이 부족한지 알아야 채울 수 있기 때문이다.
 */
export function UnlockStatusCard({ unlocked, totals }: UnlockStatusCardProps) {
  const pending = totals.filter(
    (row) => row.strengthCount < MIN_STRENGTHS_PER_PERSON,
  );

  const byGroup = new Map<string, string[]>();
  for (const row of pending) {
    const names = byGroup.get(row.groupName) ?? [];
    names.push(row.name);
    byGroup.set(row.groupName, names);
  }

  return (
    <section className="mt-6 rounded-base border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">결과 공개 상태</h2>

      <p className="mt-1 text-base">
        {unlocked
          ? "공개됨"
          : `잠김 · ${pending.length}명이 ${MIN_STRENGTHS_PER_PERSON}개 미달`}
      </p>

      {!unlocked && pending.length > 0 && (
        <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          {sortGroupNames([...byGroup.keys()]).map((group) => (
            <div key={group} className="flex gap-3">
              <dt className="shrink-0 text-muted">{group}</dt>
              <dd className="font-display">
                {(byGroup.get(group) ?? []).join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {!unlocked && totals.length === 0 && (
        <p className="mt-2 text-sm text-muted">명단부터 등록해주세요</p>
      )}
    </section>
  );
}
