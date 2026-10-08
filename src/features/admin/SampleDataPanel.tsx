"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { clearDemo, seedDemo } from "@/actions/admin/demoMode";
import { Button } from "@/components/Button";

type SampleDataPanelProps = {
  /** 예시 인물 수 (숨긴 사람 제외) */
  count: number;
};

type Confirming = "reseed" | "clear" | null;

const FAILED_NOTICE = "처리하지 못했어요. 잠시 뒤 다시 눌러주세요";

/**
 * 예시 그룹의 데이터 — 처음 상태로 다시 채우기 · 모두 지우기.
 *
 * 설명하면서 눌러본 연습 글이 쌓이면 다음 설명 전에 처음 상태로 되돌린다.
 * 둘 다 지워지는 것이 있으므로 무엇이 사라지는지 적고 한 번 더 묻는다.
 * 비어 있을 때 채우는 것은 지워지는 것이 없어 바로 한다.
 */
export function SampleDataPanel({ count }: SampleDataPanelProps) {
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

  return (
    <section className="mt-6 rounded-base border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">예시 데이터</h2>
      <p className="mt-1 text-sm">
        설명할 때 보여주는 가상의 사람들이에요. 참여 화면 맨 위에 예시라는 안내가 늘 보여요.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {count === 0 && (
          <p className="rounded-base border border-line bg-warn-surface px-3 py-2 text-sm text-warn">
            예시 데이터가 아직 없어요. 먼저 채워주세요.
          </p>
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
            disabled={pending}
            onClick={() => (count === 0 ? reseed() : setConfirming("reseed"))}
          >
            {count === 0 ? "예시 데이터 채우기" : "예시 처음 상태로 다시 채우기"}
          </Button>
        )}

        {count > 0 &&
          (confirming === "clear" ? (
            <div className="rounded-base border border-line bg-warn-surface p-3">
              <p className="num text-sm text-warn">
                예시 {count}명과 그 위에 남긴 글을 모두 지워요. 다른 그룹은 그대로예요.
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

      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-virtue-courage-ink">
          {error}
        </p>
      )}
      {notice !== null && (
        <p role="status" className="mt-3 text-sm text-muted">
          {notice}
        </p>
      )}
    </section>
  );
}
