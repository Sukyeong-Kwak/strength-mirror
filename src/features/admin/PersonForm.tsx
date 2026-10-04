"use client";

import { useId, useState } from "react";

import { Button } from "@/components/Button";
import { UNASSIGNED_GROUP_LABEL } from "@/lib/constants";

/**
 * 고르기 목록에서 '새 조' 를 뜻하는 값. 실제 조 이름과 겹치지 않게 한다.
 * 제어 문자는 쓰지 말 것 — HTML 파서가 바꿔버려 서버 렌더 값과 어긋난다
 */
const NEW_GROUP = "__new_group__";

type PersonFormProps = {
  /** 이미 있는 조 이름들. '미지정' 은 빼고 넘겨도 되고 넣어도 된다 */
  groups: readonly string[];
  initialName?: string;
  /** 처음 골라둘 조. 비우면 미지정 */
  initialGroup?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (value: { name: string; groupName: string | null }) => void;
  onCancel?: () => void;
};

/**
 * 한 사람의 이름과 조를 받는 폼. 바로 등록과 수정이 같이 쓴다.
 *
 * 조는 있는 것 중에서 고르게 한다. 손으로 치게 두면 "1조" 와 "1 조" 처럼
 * 같은 조가 두 갈래로 갈라진다. 새 조가 필요할 때만 직접 입력한다.
 */
export function PersonForm({
  groups,
  initialName = "",
  initialGroup = UNASSIGNED_GROUP_LABEL,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: PersonFormProps) {
  const id = useId();
  const choices = groups.filter((g) => g !== UNASSIGNED_GROUP_LABEL);
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState(
    initialGroup === UNASSIGNED_GROUP_LABEL || choices.includes(initialGroup)
      ? initialGroup
      : NEW_GROUP,
  );
  const [newGroup, setNewGroup] = useState(
    choices.includes(initialGroup) || initialGroup === UNASSIGNED_GROUP_LABEL
      ? ""
      : initialGroup,
  );

  const resolvedGroup =
    group === NEW_GROUP
      ? newGroup.trim()
      : group === UNASSIGNED_GROUP_LABEL
        ? ""
        : group;
  const canSubmit =
    name.trim() !== "" && !(group === NEW_GROUP && newGroup.trim() === "");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || pending) {
          return;
        }
        onSubmit({
          name: name.trim(),
          groupName: resolvedGroup === "" ? null : resolvedGroup,
        });
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm" htmlFor={`${id}-name`}>
          <span className="text-muted">이름</span>
          <input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoComplete="off"
            className="mt-1 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
          />
        </label>

        <label className="flex-1 text-sm" htmlFor={`${id}-group`}>
          <span className="text-muted">조</span>
          <select
            id={`${id}-group`}
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
          >
            {choices.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value={UNASSIGNED_GROUP_LABEL}>{UNASSIGNED_GROUP_LABEL}</option>
            <option value={NEW_GROUP}>새 조 만들기</option>
          </select>
        </label>
      </div>

      {group === NEW_GROUP && (
        <label className="block text-sm" htmlFor={`${id}-new-group`}>
          <span className="text-muted">새 조 이름</span>
          <input
            id={`${id}-new-group`}
            value={newGroup}
            onChange={(event) => setNewGroup(event.target.value)}
            maxLength={40}
            placeholder="예: 5조"
            autoComplete="off"
            className="mt-1 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {onCancel !== undefined && (
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={pending || !canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
