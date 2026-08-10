"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addAdmin, removeAdmin } from "@/actions/admin/manageAdmins";
import { Button } from "@/components/Button";
import type { AdminEntry } from "@/types/domain";

type AdminAllowlistProps = {
  entries: readonly AdminEntry[];
  currentEmail: string;
};

const FAILED_NOTICE = "처리하지 못했어요. 잠시 뒤 다시 눌러주세요";

export function AdminAllowlist({ entries, currentEmail }: AdminAllowlistProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const isLastAdmin = entries.length <= 1;

  function submitAdd() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      // startTransition 안에서 던지면 에러 바운더리까지 올라가 화면이 통째로 바뀐다.
      // 관리자 관리 화면은 그대로 두고 문구로 알린다
      try {
        const result = await addAdmin({ email, label: label.trim() });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setEmail("");
        setLabel("");
        setNotice(`${result.data.email}을 추가했어요`);
        router.refresh();
      } catch {
        setError(FAILED_NOTICE);
      }
    });
  }

  function submitRemove(target: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await removeAdmin({ email: target });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setConfirming(null);
        setNotice(`${target}을 제거했어요`);
        router.refresh();
      } catch {
        setError(FAILED_NOTICE);
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <form
        className="rounded-base border border-line bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submitAdd();
        }}
      >
        <h2 className="text-sm text-muted">관리자 추가</h2>
        <p className="mt-1 text-sm text-muted">
          추가하면 그 주소로 바로 로그인할 수 있어요.
        </p>

        <label className="mt-3 block text-sm text-muted" htmlFor="new-admin-email">
          이메일
        </label>
        <input
          id="new-admin-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-base border border-line px-3 text-base"
        />

        <label className="mt-3 block text-sm text-muted" htmlFor="new-admin-label">
          표시 이름 (선택)
        </label>
        <input
          id="new-admin-label"
          type="text"
          value={label}
          disabled={pending}
          onChange={(event) => setLabel(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-base border border-line px-3 text-base"
        />

        <div className="mt-4">
          <Button block type="submit" disabled={pending}>
            추가
          </Button>
        </div>
      </form>

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

      <section>
        <h2 className="text-sm text-muted">현재 관리자</h2>
        <ul className="mt-3 divide-y divide-line rounded-base border border-line bg-surface">
          {entries.map((entry) => (
            <li key={entry.email} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-base">{entry.label ?? entry.email}</p>
                  <p className="text-sm text-muted">{entry.email}</p>
                  <p className="mt-1 text-sm text-muted">
                    {entry.addedBy === null
                      ? "최초 등록"
                      : `${entry.addedBy}이 추가`}
                    {" · "}
                    {entry.addedAtLabel}
                  </p>
                </div>

                {confirming !== entry.email && (
                  <Button
                    variant="secondary"
                    disabled={pending || isLastAdmin}
                    onClick={() => setConfirming(entry.email)}
                  >
                    제거
                  </Button>
                )}
              </div>

              {confirming === entry.email && (
                <div className="mt-3 rounded-base border border-line p-3">
                  <p className="text-sm">
                    {entry.email === currentEmail
                      ? "본인 계정이에요. 제거하면 바로 접근할 수 없어요"
                      : "제거하면 이 주소로는 더 들어올 수 없어요"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => setConfirming(null)}
                    >
                      그대로 두기
                    </Button>
                    <Button
                      disabled={pending}
                      onClick={() => submitRemove(entry.email)}
                    >
                      제거
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {isLastAdmin && (
          <p className="mt-2 text-sm text-muted">
            마지막 관리자는 제거할 수 없어요.
          </p>
        )}
      </section>
    </div>
  );
}
