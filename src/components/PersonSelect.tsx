"use client";

import { useMemo } from "react";

import { collectGroupNames, toGroupLabel } from "@/lib/groups";
import type { Person } from "@/types/domain";

type PersonSelectProps = {
  id: string;
  people: readonly Person[];
  /** 고른 사람 id. 고르지 않았으면 null */
  value: string | null;
  onChange: (personId: string | null) => void;
  /** 아무도 고르지 않았을 때 보이는 글 */
  emptyLabel: string;
  className?: string;
};

/**
 * 등록된 명단에서 한 사람 고르기. 조별로 묶어 보여준다.
 *
 * 이름을 손으로 치게 두지 않는다. 명단에 없는 이름이 생기면
 * 그 이름으로는 아무것도 이어지지 않는다.
 */
export function PersonSelect({
  id,
  people,
  value,
  onChange,
  emptyLabel,
  className = "",
}: PersonSelectProps) {
  const groups = useMemo(() => collectGroupNames(people), [people]);

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
      className={`min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base ${className}`}
    >
      <option value="">{emptyLabel}</option>
      {groups.map((group) => (
        <optgroup key={group} label={group}>
          {people
            .filter((person) => toGroupLabel(person.groupName) === group)
            .map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
