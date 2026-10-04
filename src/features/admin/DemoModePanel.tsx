"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { clearDemo, seedDemo, setAppMode } from "@/actions/admin/demoMode";
import { Button } from "@/components/Button";
import type { AppMode } from "@/lib/data/appState";

type DemoModePanelProps = {
  mode: AppMode;
  /** 예시 인물 수 (숨긴 사람 제외) */
  demoCount: number;
  /** 실제 인물 수 (숨긴 사람 제외) */
  liveCount: number;
};

type Confirming = "go_live" | "reseed" | "clear" | null;

const FAILED_NOTICE = "처리하지 못했어요. 잠시 뒤 다시 눌러주세요";

/**
 * 참여자 화면 — 예시로 설명하다가 버튼 하나로 실제 참여로 넘긴다.
 *
 * 되돌릴 수 있는 것(전환)은 한 번 더 묻되 가볍게, 지워지는 것(다시 채우기 · 지우기)은
 * 무엇이 사라지는지 적고 묻는다. 전환은 아무것도 지우지 않는다.
 */
export function DemoModePanel({ mode, demoCount, liveCount }: DemoModePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(task: () => Promise<string | { error: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const outcome = await task();
        if (typeof outcome === "string") {
          setNotice(outcome);
          setConfirming(null);
          router.refresh();
        } else {
          setError(outcome.error);
        }
      } catch {
        setError(FAILED_NOTICE);
      }
    });
  }

  const goLive = () =>
    run(async () => {
      const result = await setAppMode("live");
      return result.ok ? "실제 참여 화면으로 바꿨어요" : { error: result.error };
    });

  // 예시가 없으면 먼저 채운 뒤 넘긴다. 빈 예시 화면을 띄울 이유가 없다
  const goDemo = () =>
    run(async () => {
      if (demoCount === 0) {
        const seeded = await seedDemo();
        if (!seeded.ok) {
          return { error: seeded.error };
        }
      }
      const result = await setAppMode("demo");
      return result.ok ? "예시 화면으로 바꿨어요" : { error: result.error };
    });

  const reseed = () =>
    run(async () => {
      const result = await seedDemo();
      return result.ok
        ? `예시 ${result.data.count}명을 새로 채웠어요`
        : { error: result.error };
    });

  const clear = () =>
    run(async () => {
      const result = await clearDemo();
      return result.ok ? "예시 데이터를 지웠어요" : { error: result.error };
    });

  const isDemo = mode === "demo";

  return (
    <section className="mt-6 rounded-base border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">참여자 화면</h2>
      <p className="mt-1 font-display text-xl">
        {isDemo ? "지금은 예시 화면이에요" : "지금은 실제 참여 화면이에요"}
      </p>
      <p className="num mt-1 text-sm text-muted">
        {isDemo
          ? `참여자에게 예시 ${demoCount}명이 보여요. 여기서 등록하는 사람은 예시에 들어가요.`
          : `참여자에게 실제 명단 ${liveCount}명이 보여요. 여기서 등록하는 사람은 실제 명단에 들어가요.`}
      </p>

      {isDemo ? (
        <div className="mt-4 flex flex-col gap-3">
          {demoCount === 0 && (
            <p className="rounded-base border border-line bg-warn-surface px-3 py-2 text-sm text-warn">
              예시 데이터가 아직 없어요. 먼저 채워주세요.
            </p>
          )}

          {confirming === "go_live" ? (
            <div className="rounded-base border border-line p-3">
              <p className="num text-sm">
                참여자 화면이 실제 명단 {liveCount}명으로 바뀌어요. 예시와 연습으로 남긴 글은
                보이지 않게 될 뿐 지워지지 않아요.
              </p>
              {liveCount === 0 && (
                <p className="mt-2 text-sm text-warn">
                  실제 명단이 아직 비어 있어요. 바꾸면 참여자에게 빈 명단이 보여요.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
                  취소
                </Button>
                <Button disabled={pending} onClick={goLive}>
                  실제 참여로 바꾸기
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => {
                setError(null);
                setNotice(null);
                setConfirming("go_live");
              }}
            >
              실제 참여로 바꾸기
            </Button>
          )}

          {confirming === "reseed" ? (
            <div className="rounded-base border border-line bg-warn-surface p-3">
              <p className="text-sm text-warn">
                예시를 처음 상태로 다시 채워요. 예시 인물에게 연습으로 남긴 글은 지워져요.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
                  취소
                </Button>
                <Button disabled={pending} onClick={reseed}>
                  다시 채우기
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => (demoCount === 0 ? reseed() : setConfirming("reseed"))}
            >
              {demoCount === 0 ? "예시 데이터 채우기" : "예시 처음 상태로 다시 채우기"}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Button variant="secondary" disabled={pending} onClick={goDemo}>
            {demoCount === 0 ? "예시를 채우고 예시 화면으로 바꾸기" : "예시 화면으로 돌아가기"}
          </Button>

          {demoCount > 0 &&
            (confirming === "clear" ? (
              <div className="rounded-base border border-line bg-warn-surface p-3">
                <p className="num text-sm text-warn">
                  예시 {demoCount}명과 그 위에 남긴 글을 모두 지워요. 실제 명단은 그대로예요.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
                    취소
                  </Button>
                  <Button disabled={pending} onClick={clear}>
                    예시 지우기
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="quiet"
                size="sm"
                disabled={pending}
                onClick={() => setConfirming("clear")}
              >
                예시 데이터 지우기
              </Button>
            ))}
        </div>
      )}

      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-virtue-courage-ink">
          {error}
        </p>
      )}
      {notice !== null && <p className="mt-3 text-sm text-muted">{notice}</p>}
    </section>
  );
}
