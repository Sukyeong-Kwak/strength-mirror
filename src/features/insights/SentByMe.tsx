"use client";

import Link from "next/link";
import { useMemo } from "react";

import { getStrength } from "@/lib/strengths";
import { useMe, useSubmissions } from "@/lib/useLocalStore";

type SentByMeProps = {
  /** 이 결과 화면의 주인 */
  personId: string;
  /** 지금 화면의 명단. 이름을 붙이고, 예시 화면의 연습 기록을 걸러내는 데 쓴다 */
  people: ReadonlyArray<{ id: string; name: string; groupLabel: string }>;
};

/**
 * 내가 남긴 강점 — 내 결과 화면에서만, 이 기기의 기록으로만.
 *
 * 이 화면의 주인이 이 기기에서 '내 이름' 으로 고른 사람일 때만 보인다.
 * 서버에는 누가 남겼는지가 없으므로 서버에 묻지 않는다. 남이 내 이름을 골라도
 * 그 사람 기기에는 내 기록이 없어서 아무것도 보이지 않는다.
 */
export function SentByMe({ personId, people }: SentByMeProps) {
  const me = useMe();
  const submissions = useSubmissions();

  const groups = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]));
    const out = new Map<string, { person: (typeof people)[number]; items: typeof submissions }>();
    for (const row of submissions) {
      const person = byId.get(row.personId);
      if (person === undefined) {
        continue;
      }
      const bucket = out.get(person.id);
      if (bucket === undefined) {
        out.set(person.id, { person, items: [row] });
      } else {
        bucket.items.push(row);
      }
    }
    // 최근에 남긴 사람이 위로
    return [...out.values()].sort((a, b) =>
      (b.items.at(-1)?.createdAt ?? "").localeCompare(a.items.at(-1)?.createdAt ?? ""),
    );
  }, [people, submissions]);

  if (me !== personId) {
    return null;
  }

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <section id="sent" className="mt-10 scroll-mt-6">
      <h2 className="text-xl">내가 남긴 강점</h2>
      <p className="mt-1 text-sm text-muted">
        이 기기에서 남긴 강점이에요. 이 기기에만 있어서 다른 사람에게는 보이지 않아요.
      </p>

      {total === 0 ? (
        <p className="mt-4 rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
          아직 이 기기에서 남긴 강점이 없어요. 명단에서 떠오르는 사람을 골라 남겨보세요.
        </p>
      ) : (
        <>
          <p className="num mt-4 text-sm text-muted">
            {groups.length}명에게 {total}개를 남겼어요
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {groups.map(({ person, items }) => (
              <li key={person.id} className="rounded-base border border-line bg-surface px-4 py-3">
                <Link href={`/p/${person.id}/result`} className="font-display text-base">
                  {person.name}
                </Link>
                <span className="ml-2 text-sm text-muted">{person.groupLabel}</span>
                <ul className="mt-2 flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={`${item.strengthCode}-${item.createdAt}`}>
                      <p className="text-sm">{getStrength(item.strengthCode).nameKo}</p>
                      {item.reason !== undefined && (
                        <p className="mt-0.5 whitespace-pre-wrap text-base leading-relaxed">
                          {item.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
