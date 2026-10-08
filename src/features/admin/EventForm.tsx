"use client";

import { useId, useState } from "react";

import { Button } from "@/components/Button";
import {
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  cleanSlugInput,
  eventHref,
  isValidSlug,
  normalizeSlug,
} from "@/lib/eventSlug";

export type EventFormValue = {
  slug: string;
  title: string;
  intro: string | null;
};

type EventFormProps = {
  initial?: EventFormValue;
  submitLabel: string;
  pending: boolean;
  onSubmit: (value: EventFormValue) => void;
  onCancel?: () => void;
};

const INTRO_MAX_LENGTH = 300;

/**
 * 그룹의 주소 · 행사 제목 · 인사말을 받는 폼. 만들기와 고치기가 같이 쓴다.
 *
 * 주소와 제목은 꼭 받는다. 주소는 치는 동안 쓸 수 없는 글자를 걸러내고,
 * 칸을 떠날 때 앞뒤 하이픈을 걷어낸다 — 다 치고 나서 "쓸 수 없는 글자예요" 를
 * 듣는 것보다 낫다.
 */
export function EventForm({
  initial = { slug: "", title: "", intro: null },
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const id = useId();
  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [intro, setIntro] = useState(initial.intro ?? "");

  const slugOk = isValidSlug(slug);
  const canSubmit = slugOk && title.trim() !== "";

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit || pending) {
          return;
        }
        onSubmit({
          slug,
          title: title.trim(),
          intro: intro.trim() === "" ? null : intro.trim(),
        });
      }}
    >
      <label className="block text-sm" htmlFor={`${id}-title`}>
        <span className="text-muted">행사 제목 (필수)</span>
        <input
          id={`${id}-title`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={40}
          placeholder="예: 청년부 리더 MT"
          autoComplete="off"
          className="mt-1 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
        />
      </label>

      <label className="block text-sm" htmlFor={`${id}-slug`}>
        <span className="text-muted">참여 주소 (필수) · 소문자 영문 · 숫자 · 하이픈</span>
        <input
          id={`${id}-slug`}
          value={slug}
          onChange={(event) => setSlug(cleanSlugInput(event.target.value))}
          onBlur={() => setSlug(normalizeSlug(slug))}
          maxLength={SLUG_MAX_LENGTH}
          placeholder="예: leader-mt"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="url"
          className="mt-1 min-h-11 w-full rounded-base border border-line bg-surface px-3 text-base"
        />
        <span className="num mt-1 block text-muted">
          {slug === ""
            ? "참여자가 받을 링크의 끝부분이에요"
            : slugOk
              ? `참여 링크: ${eventHref(slug)}`
              : slug.length < SLUG_MIN_LENGTH
                ? "두 글자 이상 써주세요"
                : "하이픈(-)은 글자 사이에만 쓸 수 있어요"}
        </span>
      </label>

      <label className="block text-sm" htmlFor={`${id}-intro`}>
        <span className="text-muted">인사말 (선택) · 첫 화면 제목 아래에 보여요</span>
        <textarea
          id={`${id}-intro`}
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          maxLength={INTRO_MAX_LENGTH}
          rows={3}
          className="mt-1 w-full rounded-base border border-line bg-surface px-3 py-2 text-base"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {onCancel !== undefined && (
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={pending || !canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
