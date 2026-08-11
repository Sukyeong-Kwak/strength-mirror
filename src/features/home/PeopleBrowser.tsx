"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button, Chip } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { collectGroupNames, toGroupLabel } from "@/lib/groups";
import { filterByQuery } from "@/lib/search";
import { saveMyGroup, submittedPersonIds } from "@/lib/submitted";
import { useSavedGroup, useSubmissions } from "@/lib/useLocalStore";
import type { Person } from "@/types/domain";

const ALL_GROUPS = "전체";

type PeopleBrowserProps = {
  people: readonly Person[];
};

/**
 * 명단 훑어보기.
 *
 * 거르기와 찾기를 브라우저에서 한다. 명단은 많아야 수백 명이라
 * 글자마다 서버에 묻는 것보다 이쪽이 빠르고, 오프라인에서도 멈추지 않는다.
 *
 * 마지막에 본 조를 기억한다. 자기 조 사람에게 남기는 일이 대부분이라
 * 열 때마다 조를 다시 고르게 하면 그 한 번이 매번 걸린다.
 */
export function PeopleBrowser({ people }: PeopleBrowserProps) {
  const [query, setQuery] = useState("");
  /** 이번에 직접 고른 조. 아직 안 골랐으면 저장해둔 조를 쓴다 */
  const [chosenGroup, setChosenGroup] = useState<string | null>(null);
  const savedGroup = useSavedGroup();
  const submissions = useSubmissions();

  const groups = useMemo(() => collectGroupNames(people), [people]);
  const donePersonIds = useMemo(
    () => submittedPersonIds(submissions),
    [submissions],
  );

  // 조 이름이 바뀌었을 수 있으므로 지금 명단에 있는 조일 때만 되살린다
  const group =
    chosenGroup ??
    (savedGroup !== null && groups.includes(savedGroup) ? savedGroup : ALL_GROUPS);

  function chooseGroup(next: string) {
    setChosenGroup(next);
    saveMyGroup(next);
  }

  const visible = useMemo(() => {
    const inGroup =
      group === ALL_GROUPS
        ? people
        : people.filter((person) => toGroupLabel(person.groupName) === group);
    return filterByQuery(inGroup, query);
  }, [people, group, query]);

  // 전체를 볼 때만 조별로 묶는다. 한 조만 볼 때는 머리글이 군더더기다
  const sections = useMemo(() => {
    if (group !== ALL_GROUPS) {
      return [{ name: group, members: visible }];
    }
    const byGroup = new Map<string, Person[]>();
    for (const person of visible) {
      const label = toGroupLabel(person.groupName);
      const bucket = byGroup.get(label);
      if (bucket === undefined) {
        byGroup.set(label, [person]);
      } else {
        bucket.push(person);
      }
    }
    return collectGroupNames(visible).map((name) => ({
      name,
      members: byGroup.get(name) ?? [],
    }));
  }, [visible, group]);

  if (people.length === 0) {
    return <EmptyState title="아직 등록된 사람이 없어요. 관리자에게 알려주세요" />;
  }

  return (
    <div>
      <label htmlFor="people-search" className="sr-only">
        이름으로 찾기
      </label>
      <div className="relative">
        <input
          id="people-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름으로 찾기 (ㄱㅅㄱ 처럼 초성도 돼요)"
          className="min-h-11 w-full rounded-base border border-line bg-surface px-4 py-3 text-base placeholder:text-muted"
        />
      </div>

      {groups.length > 1 && (
        <div className="mt-3 -mx-4 overflow-x-auto px-4">
          <div className="flex w-max gap-2">
            {[ALL_GROUPS, ...groups].map((name) => (
              <Chip
                key={name}
                pressed={name === group}
                onClick={() => chooseGroup(name)}
              >
                {name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <p className="num mt-4 text-sm text-muted">{visible.length}명</p>

      {visible.length === 0 ? (
        <div className="mt-2">
          {/* 검색어 없이 빈 조를 열었을 때 검색 탓을 하면 안 된다 */}
          {query.trim() === "" ? (
            <EmptyState title={`'${group}' 에 아직 등록된 사람이 없어요`} />
          ) : (
            <EmptyState
              title={`'${query.trim()}' 로 찾은 사람이 없어요. 다른 글자로 찾아보세요`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                  검색어 지우기
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section.name}>
              {group === ALL_GROUPS && (
                <h2 className="text-sm text-muted">{section.name}</h2>
              )}
              {/*
                이름 한 줄짜리 칸이라 좁은 화면에서도 두 줄로 깐다.
                한 줄로 세우면 한 조를 보는 데도 화면을 여러 번 넘겨야 한다.
              */}
              <ul className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
                {section.members.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/p/${person.id}`}
                      className="flex h-full min-h-11 items-center justify-between gap-2 rounded-base border border-line bg-surface px-3 py-3 sm:px-4"
                    >
                      <span className="font-display text-base">{person.name}</span>
                      {donePersonIds.has(person.id) && (
                        <span className="shrink-0 rounded-base border border-line px-1.5 py-1 text-xs text-muted">
                          남겼어요
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
