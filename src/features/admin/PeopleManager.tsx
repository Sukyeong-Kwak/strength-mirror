"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { deletePerson, setPersonHidden } from "@/actions/admin/managePeople";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { sortGroupNames } from "@/lib/groups";
import type { PersonTotals } from "@/types/domain";

type PeopleManagerProps = {
  people: readonly PersonTotals[];
};

const ALL_GROUPS = "전체";
const FAILED_NOTICE = "처리하지 못했어요. 잠시 뒤 다시 눌러주세요";

/** 지우기 전에 한 번 더 묻는 대상 */
type Confirming = { personId: string; name: string };

export function PeopleManager({ people }: PeopleManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [group, setGroup] = useState(ALL_GROUPS);
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const groups = useMemo(
    () => [ALL_GROUPS, ...sortGroupNames([...new Set(people.map((p) => p.groupName))])],
    [people],
  );

  const rows = useMemo(() => {
    const keyword = query.trim();
    return people
      .filter((p) => group === ALL_GROUPS || p.groupName === group)
      .filter((p) => keyword === "" || p.name.includes(keyword))
      .filter((p) => showHidden || !p.hidden);
  }, [people, group, query, showHidden]);

  const hiddenCount = people.filter((p) => p.hidden).length;

  function toggleHidden(person: PersonTotals) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await setPersonHidden({
          personId: person.personId,
          hidden: !person.hidden,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setNotice(
          person.hidden
            ? `${person.name}을 다시 명단에 넣었어요`
            : `${person.name}을 숨겼어요. 받은 글은 그대로 있어요`,
        );
        router.refresh();
      } catch {
        setError(FAILED_NOTICE);
      }
    });
  }

  function remove(target: Confirming) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await deletePerson({
          personId: target.personId,
          expectedName: target.name,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setConfirming(null);
        const { name, removedFeedbacks } = result.data;
        setNotice(
          removedFeedbacks === 0
            ? `${name}을 지웠어요`
            : `${name}을 지웠어요. 받은 제출 ${removedFeedbacks}건도 함께 지워졌어요`,
        );
        router.refresh();
      } catch {
        setError(FAILED_NOTICE);
      }
    });
  }

  if (people.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          title="아직 등록된 사람이 없어요. 명단부터 등록해주세요"
          action={
            <Link
              href="/admin/people/import"
              className="inline-flex min-h-11 items-center justify-center rounded-base border border-ink bg-ink px-4 text-base text-surface"
            >
              명단 등록하러 가기
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="num text-sm text-muted">
          {people.length}명
          {hiddenCount > 0 ? ` · 숨김 ${hiddenCount}명` : ""}
        </p>
        <Link
          href="/admin/people/import"
          className="min-h-11 py-3 text-sm text-muted underline underline-offset-4"
        >
          명단 등록
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
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
        className="min-h-11 w-full rounded-base border border-line px-3 text-base"
      />

      {hiddenCount > 0 && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(event) => setShowHidden(event.target.checked)}
            className="size-5"
          />
          숨긴 사람도 보기
        </label>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage-ink"
        >
          {error}
        </p>
      )}

      {notice !== null && (
        <p className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
          {notice}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState title="이 조건에 맞는 사람이 없어요. 조를 전체로 바꾸거나 검색어를 지워보세요" />
      ) : (
        <ul className="divide-y divide-line rounded-base border border-line bg-surface">
          {rows.map((person) => (
            <li key={person.personId} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`font-display text-base ${
                      person.hidden ? "text-muted line-through" : ""
                    }`}
                  >
                    {person.name}
                  </p>
                  <p className="num mt-1 text-sm text-muted">
                    {person.groupName} · 받은 강점 {person.strengthCount}개 · 제출{" "}
                    {person.submissionCount}건
                    {person.hidden ? " · 숨김" : ""}
                  </p>
                </div>

                {confirming?.personId !== person.personId && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => toggleHidden(person)}
                    >
                      {person.hidden ? "되돌리기" : "숨기기"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        setNotice(null);
                        setConfirming({
                          personId: person.personId,
                          name: person.name,
                        });
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </div>

              {confirming?.personId === person.personId && (
                <div className="mt-3 rounded-base border border-line bg-warn-surface p-3">
                  <p className="text-sm">
                    <span className="font-display">{person.name}</span>을 지울까요?
                  </p>

                  {person.submissionCount > 0 ? (
                    <p className="num mt-2 text-sm text-warn">
                      이 사람이 받은 제출 {person.submissionCount}건과 강점{" "}
                      {person.strengthCount}개도 함께 지워져요. 되돌릴 수 없어요.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-warn">되돌릴 수 없어요.</p>
                  )}

                  {person.submissionCount > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      남겨준 글을 지우고 싶지 않다면 삭제 대신 숨기기를 쓰세요.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => setConfirming(null)}
                    >
                      그대로 두기
                    </Button>
                    {person.submissionCount > 0 && !person.hidden && (
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          setConfirming(null);
                          toggleHidden(person);
                        }}
                      >
                        숨기기로 바꾸기
                      </Button>
                    )}
                    <Button
                      disabled={pending}
                      onClick={() =>
                        remove({ personId: person.personId, name: person.name })
                      }
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
