"use client";

import Link from "next/link";
import { useMemo } from "react";

import { buttonClass } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { lensFromSubmissions } from "@/lib/insights";
import { VIRTUE_META, getStrength } from "@/lib/strengths";
import { useSubmissions } from "@/lib/useLocalStore";

/**
 * 내가 사람을 보는 눈.
 *
 * 재료는 이 기기가 기억하는 '내가 남긴 강점' 뿐이다. 서버에는 누가 남겼는지가
 * 없으므로 이 화면은 서버에 묻지 않는다. 다른 기기에서 남긴 것은 여기 없다.
 *
 * 서버 렌더에서는 저장소가 비어 있어 빈 화면이 먼저 그려지고,
 * 하이드레이션 직후 기록이 있으면 채워진다 (useLocalStore 의 서버 스냅숏).
 */
export function LensView({ personIds }: { personIds: readonly string[] }) {
  const all = useSubmissions();
  // 지금 화면의 사람에게 남긴 것만 센다. 예시 화면에서 연습한 기록이 실제 시선에 섞이지 않게
  const submissions = useMemo(() => {
    const ids = new Set(personIds);
    return all.filter((row) => ids.has(row.personId));
  }, [all, personIds]);
  const lens = useMemo(() => lensFromSubmissions(submissions), [submissions]);

  if (lens.total === 0) {
    return (
      <EmptyState
        title="아직 남긴 강점이 없어요. 누군가에게 하나 남기면, 내가 사람들에게서 주로 무엇을 보는지 여기에 모여요"
        action={
          <Link href="/" className={buttonClass("primary", false, "md")}>
            명단에서 고르기
          </Link>
        }
      />
    );
  }

  const top = lens.strengths[0];
  const leaning = lens.virtues[0];
  const max = top?.count ?? 1;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-base border border-line bg-surface p-5">
        <p className="num text-sm text-muted">
          지금까지 {lens.people}명에게 {lens.total}개를 남겼어요
        </p>
        {top !== undefined && (
          <>
            <p className="mt-3 text-sm text-muted">사람들에게서 가장 자주 발견한 강점</p>
            <p className="font-display text-3xl">{getStrength(top.code).nameKo}</p>
          </>
        )}
        {leaning !== undefined && (
          <p className="mt-3 text-base">
            <span className={VIRTUE_META[leaning.virtue].textClass}>
              {VIRTUE_META[leaning.virtue].nameKo}
            </span>{" "}
            쪽으로 눈이 가는 편이에요.
          </p>
        )}

        {/* 덕목 기울기. 숫자보다 모양을 먼저 본다 */}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {lens.virtues.map((v) => (
            <div
              key={v.virtue}
              className={VIRTUE_META[v.virtue].barClass}
              style={{ width: `${v.ratio}%` }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {lens.virtues.map((v) => (
            <li key={v.virtue} className={VIRTUE_META[v.virtue].textClass}>
              {VIRTUE_META[v.virtue].nameKo} <span className="num">{v.ratio}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl">내가 남긴 강점</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {lens.strengths.map(({ code, count }) => {
            const strength = getStrength(code);
            const meta = VIRTUE_META[strength.virtue];
            return (
              <li key={code} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2">
                <Link
                  href={`/strengths/${code}`}
                  className="truncate text-base underline-offset-4 hover:underline"
                >
                  {strength.nameKo}
                </Link>
                <div className="h-2 rounded-full bg-line/40">
                  <div
                    className={`h-2 rounded-full ${meta.barClass}`}
                    style={{ width: `${(100 * count) / max}%` }}
                  />
                </div>
                <span className="num text-right text-sm text-muted">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-muted">
        이 기기에서 남긴 것만 모아 보여줘요. 누가 남겼는지는 서버 어디에도 남지 않아요.
      </p>
    </div>
  );
}
