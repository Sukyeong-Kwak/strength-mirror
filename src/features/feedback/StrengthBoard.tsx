"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

import { submitFeedback } from "@/actions/submitFeedback";
import { Button, buttonClass } from "@/components/Button";
import { Sheet } from "@/components/Sheet";
import { StrengthInfo } from "@/features/strengths/StrengthInfo";
import {
  MAX_AUTHOR_NAME_LENGTH,
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
} from "@/lib/constants";
import { STRENGTHS_BY_VIRTUE, type Strength } from "@/lib/strengths";
import {
  addSubmission,
  newSubmissionKey,
  saveAuthorName,
  saveSubmissions,
  submittedCodesFor,
} from "@/lib/submitted";
import { useSavedAuthorName, useSubmissions } from "@/lib/useLocalStore";
import type { Person } from "@/types/domain";

type StrengthBoardProps = {
  person: Person;
};

/** 사유를 쓰는 중인지, 확인 화면인지 */
type WriteStep = "write" | "confirm";

/**
 * 강점 고르기 → 사유 쓰기 → 확인 → 저장.
 *
 * 한 번에 하나씩 남긴다. 여러 개를 골라두고 마지막에 몰아서 쓰게 하면
 * 사유를 쓰다 지쳐 앞의 선택을 지우게 된다.
 *
 * 저장한 것은 고칠 수 없다. 그래서 저장 직전에 확인 단계를 한 번 둔다.
 * 이미 남긴 강점은 다시 고를 수 없게 막는다.
 */
export function StrengthBoard({ person }: StrengthBoardProps) {
  const [info, setInfo] = useState<Strength | null>(null);
  const [writing, setWriting] = useState<Strength | null>(null);
  const [step, setStep] = useState<WriteStep>("write");
  const [reason, setReason] = useState("");
  /** 이번에 직접 적은 이름. 안 건드렸으면 지난번에 적은 이름을 쓴다 */
  const [typedName, setTypedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Strength | null>(null);
  const [pending, startTransition] = useTransition();

  const mine = useSubmissions();
  const savedName = useSavedAuthorName();
  const authorName = typedName ?? savedName;

  /**
   * 이 제출에 쓸 멱등 키.
   * 사유 시트를 열 때 한 번 만든다. 저장이 실패해 다시 눌러도 같은 키가 나가므로
   * 통신이 끊겼다가 늦게 도착한 요청과 겹쳐도 한 건만 저장된다.
   */
  const submissionKey = useRef<string | null>(null);

  const doneCodes: ReadonlySet<string> = useMemo(
    () => submittedCodesFor(mine, person.id),
    [mine, person.id],
  );

  const trimmedReason = reason.trim();
  const canSave = trimmedReason.length >= MIN_REASON_LENGTH;

  function openWrite(strength: Strength) {
    submissionKey.current = newSubmissionKey();
    setWriting(strength);
    setStep("write");
    setReason("");
    setError(null);
  }

  function closeWrite() {
    if (pending) {
      return;
    }
    setWriting(null);
    setError(null);
  }

  function save() {
    const strength = writing;
    const key = submissionKey.current;
    if (strength === null || key === null) {
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        personId: person.id,
        submissionKey: key,
        strengthCode: strength.code,
        reason: trimmedReason,
        authorName: authorName.trim(),
      });

      if (!result.ok) {
        setError(result.error);
        setStep("write");
        return;
      }

      // 저장소가 곧 화면의 출처다. 여기에 쓰면 목록이 알아서 다시 그려진다
      saveSubmissions(
        addSubmission(mine, {
          personId: person.id,
          strengthCode: strength.code,
          createdAt: new Date().toISOString(),
        }),
      );
      saveAuthorName(authorName);

      setWriting(null);
      setSaved(strength);
    });
  }

  return (
    <div>
      <p className="mt-2 text-sm text-muted">
        떠오르는 강점을 눌러 이유를 적어주세요. 한 번에 하나씩 남깁니다.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {STRENGTHS_BY_VIRTUE.map(({ virtue, meta, strengths }) => (
          <section key={virtue}>
            <h2 className={`text-sm ${meta.textClass}`}>{meta.nameKo}</h2>

            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {strengths.map((strength) => {
                const done = doneCodes.has(strength.code);
                return (
                  <li key={strength.code} className="relative">
                    <button
                      type="button"
                      onClick={() => openWrite(strength)}
                      disabled={done}
                      className="w-full rounded-base border border-line bg-surface p-4 pr-20 text-left disabled:opacity-50"
                    >
                      <span className="font-display text-base">{strength.nameKo}</span>
                      <span className="mt-1 block text-sm text-muted">
                        {done ? "이미 남겼어요" : strength.short}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInfo(strength)}
                      aria-label={`${strength.nameKo} 설명 보기`}
                      className="absolute right-1 top-1 min-h-11 min-w-11 rounded-base px-2 text-sm text-muted underline underline-offset-4"
                    >
                      설명
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <StrengthInfo strength={info} onClose={() => setInfo(null)} />

      <Sheet
        open={writing !== null}
        title={
          writing === null
            ? ""
            : step === "write"
              ? writing.nameKo
              : "이대로 남길까요?"
        }
        onClose={closeWrite}
        footer={
          step === "write" ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeWrite} block>
                취소
              </Button>
              <Button onClick={() => setStep("confirm")} disabled={!canSave} block>
                등록하기
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep("write")}
                disabled={pending}
                block
              >
                수정
              </Button>
              <Button onClick={save} disabled={pending} block>
                {pending ? "등록 중…" : "등록"}
              </Button>
            </div>
          )
        }
      >
        {writing !== null && step === "write" && (
          <div>
            <p className="text-base leading-relaxed">{writing.long}</p>

            <label
              htmlFor="reason"
              className="mt-5 block text-sm text-muted"
            >
              {person.name}님에게서 이 강점을 본 순간을 적어주세요
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              maxLength={MAX_REASON_LENGTH}
              placeholder="언제, 어떤 모습이었는지 적으면 받는 사람에게 오래 남아요"
              className="mt-2 w-full rounded-base border border-line bg-surface px-4 py-3 text-base placeholder:text-muted"
            />
            <p className="num mt-1 text-sm text-muted">
              {trimmedReason.length < MIN_REASON_LENGTH
                ? `${MIN_REASON_LENGTH - trimmedReason.length}자 더 적어주세요`
                : `${trimmedReason.length}자`}
            </p>

            <label htmlFor="author" className="mt-5 block text-sm text-muted">
              남기는 사람 (안 적으면 익명이에요)
            </label>
            <input
              id="author"
              type="text"
              value={authorName}
              onChange={(event) => setTypedName(event.target.value)}
              maxLength={MAX_AUTHOR_NAME_LENGTH}
              placeholder="익명"
              className="mt-2 min-h-11 w-full rounded-base border border-line bg-surface px-4 py-3 text-base placeholder:text-muted"
            />

            {error !== null && (
              <p className="mt-4 rounded-base border border-line bg-warn-surface px-4 py-3 text-sm text-warn">
                {error}
              </p>
            )}
          </div>
        )}

        {writing !== null && step === "confirm" && (
          <div>
            <p className="rounded-base border border-line bg-warn-surface px-4 py-3 text-sm text-warn">
              남기면 고치거나 지울 수 없어요. 한 번만 더 읽어봐 주세요.
            </p>

            <dl className="mt-4 flex flex-col gap-4">
              <div>
                <dt className="text-sm text-muted">누구에게</dt>
                <dd className="font-display mt-1 text-base">{person.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">어떤 강점</dt>
                <dd className="font-display mt-1 text-base">{writing.nameKo}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">이유</dt>
                <dd className="mt-1 whitespace-pre-wrap text-base leading-relaxed">
                  {trimmedReason}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">남기는 사람</dt>
                <dd className="mt-1 text-base">
                  {authorName.trim() === "" ? "익명" : authorName.trim()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Sheet>

      <Sheet
        open={saved !== null}
        title="남겼어요"
        onClose={() => setSaved(null)}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSaved(null)} block>
              더 남기기
            </Button>
            <Link href="/" className={buttonClass("primary", true)}>
              명단으로
            </Link>
          </div>
        }
      >
        {saved !== null && (
          <div>
            <p className="text-base leading-relaxed">
              {person.name}님에게 &lsquo;{saved.nameKo}&rsquo; 강점을 남겼어요.
            </p>
            <p className="mt-2 text-sm text-muted">
              결과는 모두가 5개씩 받은 뒤에 함께 열려요.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
