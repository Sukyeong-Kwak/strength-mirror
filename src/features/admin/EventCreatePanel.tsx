"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createEvent } from "@/actions/admin/manageEvents";
import { Button } from "@/components/Button";
import { EventForm, type EventFormValue } from "@/features/admin/EventForm";
import { adminEventHref } from "@/lib/eventSlug";

/**
 * 새 그룹 만들기. 처음에는 버튼 하나로 접어 둔다 — 자주 하는 일이 아니다.
 * 만들고 나면 그 그룹의 관리 화면으로 가서 바로 명단을 넣게 한다.
 */
export function EventCreatePanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(value: EventFormValue) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createEvent(value);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(adminEventHref(result.data.slug));
      } catch {
        setError("만들지 못했어요. 잠시 뒤 다시 눌러주세요");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" block onClick={() => setOpen(true)}>
        새 그룹 만들기
      </Button>
    );
  }

  return (
    <section className="rounded-base border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">새 그룹 만들기</h2>
      <div className="mt-3">
        <EventForm
          submitLabel="만들기"
          pending={pending}
          onSubmit={submit}
          onCancel={() => {
            setOpen(false);
            setError(null);
          }}
        />
      </div>
      {error !== null && (
        <p role="alert" className="mt-3 text-sm text-virtue-courage-ink">
          {error}
        </p>
      )}
    </section>
  );
}
