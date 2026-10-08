"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateEvent } from "@/actions/admin/manageEvents";
import { Button } from "@/components/Button";
import { EventForm, type EventFormValue } from "@/features/admin/EventForm";
import { adminEventHref } from "@/lib/eventSlug";
import type { EventInfo } from "@/types/domain";

/**
 * 그룹 정보 고치기 — 주소 · 행사 제목 · 인사말.
 *
 * 주소를 바꾸면 이미 보낸 링크가 열리지 않는다. 폼을 열 때 그 점을 먼저 적는다.
 * 주소가 바뀌면 이 관리 화면의 주소도 바뀌므로 새 주소로 옮긴다.
 */
export function EventSettingsPanel({ event }: { event: EventInfo }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function submit(value: EventFormValue) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const result = await updateEvent({ eventId: event.id, ...value });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setEditing(false);
        setNotice("고쳤어요");
        if (result.data.slug !== event.slug) {
          router.replace(adminEventHref(result.data.slug));
        } else {
          router.refresh();
        }
      } catch {
        setError("고치지 못했어요. 잠시 뒤 다시 눌러주세요");
      }
    });
  }

  return (
    <section className="mt-6 rounded-base border border-line bg-surface p-4">
      <h2 className="text-sm text-muted">그룹 정보</h2>

      {editing ? (
        <div className="mt-3">
          <p className="mb-3 rounded-base border border-line bg-warn-surface px-3 py-2 text-sm text-warn">
            참여 주소를 바꾸면 이미 보낸 링크는 열리지 않아요. 새 링크를 다시 보내주세요.
          </p>
          <EventForm
            initial={{ slug: event.slug, title: event.title, intro: event.intro }}
            submitLabel="저장"
            pending={pending}
            onSubmit={submit}
            onCancel={() => {
              setEditing(false);
              setError(null);
            }}
          />
        </div>
      ) : (
        <>
          <dl className="mt-2 space-y-2 text-sm">
            <div>
              <dt className="text-muted">행사 제목</dt>
              <dd className="text-base">{event.title}</dd>
            </div>
            <div>
              <dt className="text-muted">인사말</dt>
              <dd className="whitespace-pre-wrap text-base">{event.intro ?? "없음"}</dd>
            </div>
          </dl>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              고치기
            </Button>
          </div>
        </>
      )}

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
