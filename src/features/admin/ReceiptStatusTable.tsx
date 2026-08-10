"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { MIN_STRENGTHS_PER_PERSON } from "@/lib/constants";
import { sortGroupNames } from "@/lib/groups";
import type { PersonTotals } from "@/types/domain";

type ReceiptStatusTableProps = {
  totals: readonly PersonTotals[];
  /** 이메일 → 표시 이름. 누가 등록했는지 보여주기 위한 것 */
  registrarLabels: ReadonlyMap<string, string>;
};

const ALL_GROUPS = "전체";

/**
 * 수신 현황. 관리자만 볼 수 있다.
 *
 * 이 데이터는 person_totals_internal 에서 오고, 그 뷰는 is_admin() 인
 * 사용자에게만 열려 있다. anon 은 어떤 경로로도 읽을 수 없다.
 */
export function ReceiptStatusTable({
  totals,
  registrarLabels,
}: ReceiptStatusTableProps) {
  const [group, setGroup] = useState<string>(ALL_GROUPS);
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () => [ALL_GROUPS, ...sortGroupNames([...new Set(totals.map((t) => t.groupName))])],
    [totals],
  );

  const rows = useMemo(() => {
    const keyword = query.trim();
    return totals
      .filter((row) => group === ALL_GROUPS || row.groupName === group)
      .filter((row) => keyword === "" || row.name.includes(keyword))
      .sort((a, b) => a.strengthCount - b.strengthCount);
  }, [totals, group, query]);

  const done = totals.filter(
    (row) => row.strengthCount >= MIN_STRENGTHS_PER_PERSON,
  ).length;

  const filtered = group !== ALL_GROUPS || query.trim() !== "";

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-muted">수신 현황</h2>
        <p className="num text-sm text-muted">
          {totals.length}명 중 {done}명 완료
        </p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {groups.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setGroup(name)}
            className={`min-h-11 shrink-0 rounded-base border px-3 text-sm ${
              group === name
                ? "border-ink bg-ink text-surface"
                : "border-line bg-surface text-ink"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="이름 검색"
        aria-label="이름 검색"
        className="mt-3 min-h-11 w-full rounded-base border border-line px-3 text-base"
      />

      {rows.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title={
              filtered
                ? "이 조건에 맞는 사람이 없어요. 조를 전체로 바꾸거나 검색어를 지워보세요"
                : "아직 등록된 사람이 없어요. 명단부터 등록해주세요"
            }
          />
        </div>
      ) : (
        // min-w-max 가 없으면 표가 부모 폭에 맞춰 줄어들어 가로 스크롤이 생기지 않는다
        <div className="mt-3 overflow-x-auto rounded-base border border-line bg-surface">
          <table className="w-full min-w-max text-sm">
            <thead className="border-b border-line text-left text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-normal">이름</th>
                <th scope="col" className="px-3 py-2 font-normal">조</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">받은 강점</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">받은 제출</th>
                <th scope="col" className="px-3 py-2 font-normal">상태</th>
                <th scope="col" className="px-3 py-2 font-normal">등록</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const short = row.strengthCount < MIN_STRENGTHS_PER_PERSON;
                return (
                  <tr
                    key={row.personId}
                    className={`border-b border-line last:border-b-0 ${
                      short ? "bg-warn-surface" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-display">{row.name}</td>
                    <td className="px-3 py-2 text-muted">{row.groupName}</td>
                    <td className="num px-3 py-2 text-right">{row.strengthCount}</td>
                    <td className="num px-3 py-2 text-right">{row.submissionCount}</td>
                    <td className={`px-3 py-2 ${short ? "text-warn" : "text-muted"}`}>
                      {short ? "미달" : "완료"}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {row.createdBy === null
                        ? "—"
                        : (registrarLabels.get(row.createdBy) ?? row.createdBy)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
