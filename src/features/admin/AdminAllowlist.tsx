"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addAdmin, removeAdmin } from "@/actions/admin/manageAdmins";
import { Button } from "@/components/Button";
import { formatRelativeTime } from "@/lib/time";

export type AdminEntry = {
  email: string;
  label: string | null;
  addedBy: string | null;
  createdAt: string;
};

type AdminAllowlistProps = {
  entries: readonly AdminEntry[];
  currentEmail: string;
};

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
      const result = await addAdmin({ email, label: label.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail("");
      setLabel("");
      setNotice(`${result.data.email}을 추가했습니다`);
      router.refresh();
    });
  }

  function submitRemove(target: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await removeAdmin({ email: target });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirming(null);
      setNotice(`${target}을 제거했습니다`);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-base border border-line bg-surface p-4">
        <h2 className="text-sm text-muted">관리자 추가</h2>
        <p className="mt-1 text-sm text-muted">
          추가하면 재배포 없이 바로 로그인할 수 있어요.
        </p>

        <label className="mt-3 block text-sm text-muted" htmlFor="new-admin-email">
          이메일
        </label>
        <input
          id="new-admin-email"
          type="email"
          inputMode="email"
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
          <Button block disabled={pending} onClick={submitAdd}>
            추가
          </Button>
        </div>
      </section>

      {error !== null && (
        <p
          role="alert"
          className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage"
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
                    {formatRelativeTime(entry.createdAt)}
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
                      : "제거하면 다음 요청부터 접근할 수 없어요"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => setConfirming(null)}
                    >
                      돌아가기
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
