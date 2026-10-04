"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/Button";
import { PersonSelect } from "@/components/PersonSelect";
import { saveMe } from "@/lib/submitted";
import { useMe } from "@/lib/useLocalStore";
import type { Person } from "@/types/domain";

type ExploreCardsProps = {
  /** 지금 화면의 명단. 내 이름은 여기서만 고른다 */
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
 * 그래서 명단 위에 칸으로 펼치고, 칸마다 안에 무엇이 있는지 한 줄씩 적는다.
 *
 * 내 이름은 등록된 명단에서만 고른다. 손으로 치게 두면 명단에 없는 이름이 생긴다.
 * 고른 이름은 이 기기에만 기억한다 (lib/submitted 의 saveMe).
 */
export function ExploreCards({ people, omit, showHeading = true }: ExploreCardsProps) {
  const meId = useMe();
  // 명단이 바뀌었거나 다른 모드라 지금 명단에 없으면 고르지 않은 것으로 본다
  const me = useMemo(
    () => people.find((person) => person.id === meId) ?? null,
    [people, meId],
  );

  return (
    <section aria-label="둘러보기">
      {showHeading && <h2 className="mb-2 text-sm text-muted">둘러보기</h2>}
      <ul className={`grid gap-2 ${omit === undefined ? "sm:grid-cols-2" : ""}`}>
        <li>
          {me !== null ? (
            <div className={CARD}>
              <Link href={`/p/${me.id}/result`} className="block">
                <span className="font-display text-lg">{me.name}님의 강점</span>
                <span className="mt-1 block text-sm text-muted">
                  주신 강점 · 내가 남긴 강점 · 결이 비슷한 사람 · PDF로 받기
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
                명단에서 내 이름을 골라두면 주신 강점과 내가 남긴 강점을 바로 볼 수 있어요.
                이 기기에만 기억해요.
              </span>
              <PersonSelect
                id="pick-me"
                people={people}
                value={null}
                onChange={saveMe}
                emptyLabel="내 이름 고르기"
                className="mt-3"
              />
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
      </ul>
    </section>
  );
}
