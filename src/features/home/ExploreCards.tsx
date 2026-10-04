"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/Button";
import { collectGroupNames, toGroupLabel } from "@/lib/groups";
import { saveMe } from "@/lib/submitted";
import { useMe, useSubmissions } from "@/lib/useLocalStore";
import type { Person } from "@/types/domain";

type ExploreCardsProps = {
  people: readonly Person[];
  /** 지금 있는 화면의 칸은 뺀다. 모두의 강점 화면에서 모두의 강점으로 가는 칸은 군더더기다 */
  omit?: "results";
  /** 바깥에 이미 제목이 있으면 끈다 */
  showHeading?: boolean;
};

const CARD =
  "flex h-full flex-col rounded-base border border-line bg-surface px-4 py-4 text-left";

/**
 * 둘러보기 — 남기는 것 말고 볼 수 있는 것들.
 *
 * 볼거리를 작은 링크 하나에 묻어두면 있는 줄도 모르고 지나간다.
 * 보고 안 누르는 것은 괜찮지만 몰라서 못 누르면 안 된다.
 * 그래서 명단 위에 세 칸으로 펼치고, 칸마다 안에 무엇이 있는지 한 줄씩 적는다.
 */
export function ExploreCards({ people, omit, showHeading = true }: ExploreCardsProps) {
  const meId = useMe();
  const allSubmissions = useSubmissions();
  // 예시 화면에서 연습한 기록은 실제 화면에서 세지 않는다 (반대도 마찬가지)
  const submissions = useMemo(() => {
    const ids = new Set(people.map((person) => person.id));
    return allSubmissions.filter((row) => ids.has(row.personId));
  }, [allSubmissions, people]);
  const me = useMemo(
    () => people.find((person) => person.id === meId) ?? null,
    [people, meId],
  );
  const groups = useMemo(() => collectGroupNames(people), [people]);

  return (
    <section aria-label="둘러보기">
      {showHeading && <h2 className="mb-2 text-sm text-muted">둘러보기</h2>}
      <ul className={`grid gap-2 ${omit === undefined ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <li>
          {me !== null ? (
            <div className={CARD}>
              <Link href={`/p/${me.id}/result`} className="block">
                <span className="font-display text-lg">{me.name}님의 강점</span>
                <span className="mt-1 block text-sm text-muted">
                  강점 카드 · 유독 많이 보인 강점 · 결이 비슷한 사람 · PDF로 받기
                </span>
              </Link>
              <div className="mt-auto pt-2">
                <Button variant="quiet" size="sm" onClick={() => saveMe(null)}>
                  다른 이름으로 바꾸기
                </Button>
              </div>
            </div>
          ) : (
            <div className={CARD}>
              <label htmlFor="pick-me" className="font-display text-lg">
                내 강점
              </label>
              <span className="mt-1 block text-sm text-muted">
                내 이름을 골라두면 언제든 바로 열 수 있어요. 이 기기에만 기억해요.
              </span>
              <select
                id="pick-me"
                value=""
                onChange={(event) => {
                  if (event.target.value !== "") {
                    saveMe(event.target.value);
                  }
                }}
                className="mt-3 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
              >
                <option value="">내 이름 고르기</option>
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
            </div>
          )}
        </li>

        {omit !== "results" && (
        <li>
          <Link href="/results" className={CARD}>
            <span className="font-display text-lg">모두의 강점</span>
            <span className="mt-1 block text-sm text-muted">
              우리 모임의 결 · 조마다의 색 · 아직 숨은 강점 · PDF로 받기
            </span>
          </Link>
        </li>
        )}

        <li>
          <Link href="/me" className={CARD}>
            <span className="font-display text-lg">내가 사람을 보는 눈</span>
            <span className="num mt-1 block text-sm text-muted">
              {submissions.length > 0
                ? `지금까지 ${submissions.length}개를 남겼어요. 내가 주로 발견하는 강점은?`
                : "남길수록 내가 사람들에게서 무엇을 보는지 드러나요"}
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
