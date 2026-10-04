"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

import { submitFeedback } from "@/actions/submitFeedback";
import { Button, buttonClass } from "@/components/Button";
import { PersonSelect } from "@/components/PersonSelect";
import { Sheet } from "@/components/Sheet";
import { StrengthInfo } from "@/features/strengths/StrengthInfo";
import { MAX_REASON_LENGTH, MIN_REASON_LENGTH } from "@/lib/constants";
import { STRENGTHS_BY_VIRTUE, type Strength } from "@/lib/strengths";
import {
  addSubmission,
  newSubmissionKey,
  readDraft,
  saveDraft,
  saveMe,
  saveSubmissions,
  submittedCodesFor,
} from "@/lib/submitted";
import { useMe, useSubmissions } from "@/lib/useLocalStore";
import type { ActionResult, Person } from "@/types/domain";

type StrengthBoardProps = {
  person: Person;
  /** 지금 화면의 명단. '남기는 사람' 은 여기서만 고른다 */
  people: readonly Person[];
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
 *
 * 쓰던 사유는 강점마다 이 기기에 남겨둔다. 시트를 잘못 닫아도
 * 같은 강점을 다시 누르면 이어서 쓴다.
 *
 * 남기는 사람은 등록된 명단에서 고르게 한다. 고른 이름은 이 기기의 '내 이름' 이 되어
 * 내 결과 화면의 '내가 남긴 강점' 에 모인다. 서버에는 보내지 않는다 — 로그인이 없어
 * 누구나 아무 이름이나 고를 수 있으므로, 서버에 남기면 익명이 깨질 뿐 믿을 수도 없다.
 * 결과 화면에서 남긴 사람은 모두 익명이다.
 */
export function StrengthBoard({ person, people }: StrengthBoardProps) {
  const [info, setInfo] = useState<Strength | null>(null);
  const [writing, setWriting] = useState<Strength | null>(null);
  const [step, setStep] = useState<WriteStep>("write");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Strength | null>(null);
  const [pending, startTransition] = useTransition();

  const mine = useSubmissions();
  const meId = useMe();
  // 지금 명단에 없는 사람(다른 모드 · 지운 사람)이면 고르지 않은 것으로 본다
  const me = people.find((p) => p.id === meId) ?? null;

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
    setReason(readDraft(person.id, strength.code));
    setError(null);
  }

  function changeReason(next: string) {
    setReason(next);
    if (writing !== null) {
      saveDraft(person.id, writing.code, next);
    }
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
      // 통신이 끊기면 Server Action 이 예외를 그대로 던진다.
      // 받지 않으면 오류 화면으로 튕겨 적던 글이 통째로 날아간다.
      // 같은 멱등 키가 남아 있으니 그대로 다시 눌러도 두 번 저장되지 않는다
      const result = await submitFeedback({
        personId: person.id,
        submissionKey: key,
        strengthCode: strength.code,
        reason: trimmedReason,
      }).catch((): ActionResult => ({
        ok: false,
        error: "연결이 끊겼어요. 잠시 뒤 다시 눌러주세요",
      }));

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
          // '내가 남긴 강점' 에서 다시 보여준다. 이 기기에만 남는다
          reason: trimmedReason,
        }),
      );
      saveDraft(person.id, strength.code, "");

      setWriting(null);
      setSaved(strength);
    });
  }

  return (
    <div>
      {/*
        이 화면의 할 일은 강점을 고르는 것이다. 위의 '주신 강점 보기 · PDF' 는 곁길이라
        선을 긋고, 안내를 작은 회색 글씨가 아니라 제목으로 세운다
      */}
      <div className="mt-6 border-t border-line pt-6">
        <h2 className="text-lg">어떤 강점을 발견했나요?</h2>
        <p className="mt-1 text-sm text-muted">
          이 사람에게서 발견한, 하나님께서 주신 강점을 골라보세요. 여러 개라면 하나씩 차례로 남기면 돼요.
        </p>
      </div>

      {/*
        고르는 사람에게는 스물넷이 한 화면에 들어오는 것이 가장 중요하다.
        카드마다 한 줄 설명을 달면 목록이 세 배로 길어져서, 아래쪽 강점은
        스크롤을 내리다 지쳐 후보에서 빠진다. 이름만 남기고 한 줄로 눕힌다.
        설명은 옆의 작은 버튼으로 언제든 열 수 있다.
      */}
      <div className="mt-6 flex flex-col gap-6">
        {STRENGTHS_BY_VIRTUE.map(({ virtue, meta, strengths }) => (
          <section key={virtue}>
            <h2 className={`text-sm ${meta.textClass}`}>{meta.nameKo}</h2>

            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {strengths.map((strength) => {
                const done = doneCodes.has(strength.code);
                return (
                  <li
                    key={strength.code}
                    className="flex items-stretch overflow-hidden rounded-base border border-line bg-surface"
                  >
                    {/* 이 앱이 존재하는 이유. 옆의 '설명' 보다 확실히 커야 한다 */}
                    <button
                      type="button"
                      onClick={() => openWrite(strength)}
                      disabled={done}
                      className="flex min-h-14 flex-1 items-center gap-2 px-3 text-left disabled:opacity-50"
                    >
                      {/* 덕목 색 점. 머리글에서 눈을 떼도 어느 묶음인지 남는다 */}
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${meta.barClass}`}
                      />
                      <span className="font-display text-base">{strength.nameKo}</span>
                      {done && (
                        <span className="ml-auto shrink-0 text-xs text-muted">남김</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInfo(strength)}
                      aria-label={`${strength.nameKo} 설명 보기`}
                      className="min-h-14 shrink-0 border-l border-line px-2.5 text-xs text-muted"
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
          /* 시트가 열려 있는 동안은 이 두 개가 화면의 전부다. 가장 큰 크기로 */
          step === "write" ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" onClick={closeWrite} block>
                취소
              </Button>
              <Button
                size="lg"
                onClick={() => setStep("confirm")}
                disabled={!canSave}
                block
              >
                남기기
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setStep("write")}
                disabled={pending}
                block
              >
                다시 쓰기
              </Button>
              <Button size="lg" onClick={save} disabled={pending} block>
                {pending ? "남기는 중…" : "남기기"}
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
              {person.name}님에게서 이 강점이 보였던 순간
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => changeReason(event.target.value)}
              rows={5}
              maxLength={MAX_REASON_LENGTH}
              placeholder="거창하지 않아도 돼요. 그때 그 장면 하나면 충분해요"
              className="mt-2 w-full rounded-base border border-line bg-surface px-4 py-3 text-base placeholder:text-muted"
            />
            <p className="num mt-1 text-sm text-muted">
              {trimmedReason.length < MIN_REASON_LENGTH
                ? `${MIN_REASON_LENGTH - trimmedReason.length}자만 더 쓰면 남길 수 있어요`
                : `${trimmedReason.length}자`}
            </p>
            <label htmlFor="author" className="mt-5 block text-sm text-muted">
              남기는 사람
            </label>
            <PersonSelect
              id="author"
              people={people}
              value={me?.id ?? null}
              onChange={saveMe}
              emptyLabel="고르지 않고 남기기"
              className="mt-2"
            />
            <p className="mt-3 text-sm text-muted">
              남긴 글은 누구나 볼 수 있고, 남긴 사람은 익명으로 보여요. 고른 이름은 이 기기에만
              기억해서, 내 결과 화면에 내가 남긴 강점으로 모아줘요.
            </p>

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
              남긴 뒤에는 고치거나 지울 수 없어요.
            </p>

            <dl className="mt-4 flex flex-col gap-4">
              <div>
                <dt className="text-sm text-muted">남기는 사람</dt>
                <dd className="mt-1 text-base">
                  {me === null ? "고르지 않음" : me.name}
                  <span className="text-sm text-muted"> · 결과에는 익명으로 보여요</span>
                </dd>
              </div>
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
            <Button variant="secondary" size="lg" onClick={() => setSaved(null)} block>
              더 남기기
            </Button>
            <Link href="/" className={buttonClass("primary", true, "lg")}>
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
              주신 강점 보기에서 바로 확인할 수 있어요. 남긴 사람은 익명으로 보여요.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
