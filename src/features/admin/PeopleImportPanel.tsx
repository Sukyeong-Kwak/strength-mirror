"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { importPeople } from "@/actions/admin/importPeople";
import { Button } from "@/components/Button";
import { sortGroupNames, toGroupLabel } from "@/lib/groups";
import {
  markExisting,
  parsePeopleText,
  type ParsedPerson,
  type ParsedStatus,
} from "@/lib/parsePeople";

type ExistingPerson = { name: string; groupName: string | null };

type PeopleImportPanelProps = {
  /** 화면을 연 시점의 명단. "이미 있음" 표시에만 쓴다 */
  existing: readonly ExistingPerson[];
};

const STATUS_LABEL: Record<ParsedStatus, string> = {
  new: "등록",
  already_exists: "이미 있음",
  duplicate_in_input: "글 안에서 중복",
  needs_review: "확인 필요",
};

/** 요약을 고정 순서로 보여준다. Map 순서를 쓰면 입력할 때마다 자리가 바뀐다 */
const STATUS_ORDER: readonly ParsedStatus[] = [
  "new",
  "needs_review",
  "already_exists",
  "duplicate_in_input",
];

/** 한 번에 등록할 수 있는 최대 인원. 서버의 같은 값과 맞춘다 */
const MAX_IMPORT_ROWS = 300;

/** 기본으로 체크할 상태. 나머지는 관리자가 직접 켜야 한다 */
function defaultChecked(status: ParsedStatus): boolean {
  return status === "new";
}

const PLACEHOLDER = `1조
김수경, 이영희
박철수 형제

2조
최민수
정하나`;

export function PeopleImportPanel({ existing }: PeopleImportPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 파서는 순수 함수라 서버를 거치지 않는다. 입력하는 대로 미리보기가 바뀐다
  const parsed = useMemo(
    () => markExisting(parsePeopleText(text), existing),
    [text, existing],
  );

  /** 화면에서 고친 이름을 얹는다 */
  function nameOf(person: ParsedPerson): string {
    return edited[person.id] ?? person.name;
  }

  /** 관리자가 이름을 고쳤는지 */
  function isEdited(person: ParsedPerson): boolean {
    const value = edited[person.id];
    return value !== undefined && value !== person.name;
  }

  /** 체크 여부. 관리자가 건드린 적이 없으면 상태에 따른 기본값 */
  function isChecked(person: ParsedPerson): boolean {
    const override = excluded[person.id];
    return override === undefined ? defaultChecked(person.status) : !override;
  }

  const selected = parsed.filter(isChecked);

  /** 이름을 지운 채로 체크해두면 서버가 명단 전체를 되돌린다. 미리 막는다 */
  const blankName = selected.some((person) => nameOf(person).trim() === "");
  const tooMany = selected.length > MAX_IMPORT_ROWS;

  let blocked: string | null = null;
  if (blankName) {
    blocked = "이름이 빈 줄이 있어요. 채우거나 체크를 풀어주세요";
  } else if (tooMany) {
    blocked = `한 번에 ${MAX_IMPORT_ROWS}명까지 등록할 수 있어요. 나눠서 등록해주세요`;
  }

  const counts = useMemo(() => {
    const byStatus = new Map<ParsedStatus, number>();
    for (const person of parsed) {
      byStatus.set(person.status, (byStatus.get(person.status) ?? 0) + 1);
    }
    return byStatus;
  }, [parsed]);

  /** 조별로 묶어 보여준다. 조가 없는 사람이 먼저 */
  const groups = useMemo(() => {
    const byGroup = new Map<string, ParsedPerson[]>();
    for (const person of parsed) {
      const label = toGroupLabel(person.groupName);
      const list = byGroup.get(label) ?? [];
      list.push(person);
      byGroup.set(label, list);
    }
    return sortGroupNames([...byGroup.keys()]).map((label) => ({
      label,
      people: byGroup.get(label) ?? [],
    }));
  }, [parsed]);

  function submit() {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      try {
        const result = await importPeople({
          people: selected.map((person) => ({
            name: nameOf(person),
            groupName: person.groupName,
          })),
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        const { added, skipped } = result.data;
        setConfirming(false);
        setText("");
        setEdited({});
        setExcluded({});
        setNotice(
          skipped === 0
            ? `${added}명을 등록했어요`
            : `${added}명을 등록했어요. ${skipped}명은 이미 있어서 건너뛰었어요`,
        );
        router.refresh();
      } catch {
        setError("등록하지 못했어요. 잠시 뒤 다시 눌러주세요");
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-base border border-line bg-surface p-4">
        <label className="block text-sm text-muted" htmlFor="people-text">
          명단 붙여넣기
        </label>
        <p className="mt-1 text-sm text-muted">
          조 이름을 줄 하나에 적고 그 아래에 사람 이름을 적어주세요. 쉼표로 나열해도 돼요.
        </p>
        <textarea
          id="people-text"
          value={text}
          disabled={pending}
          onChange={(event) => {
            setText(event.target.value);
            setEdited({});
            setExcluded({});
            setConfirming(false);
          }}
          rows={10}
          placeholder={PLACEHOLDER}
          className="mt-3 w-full rounded-base border border-line px-3 py-2 text-base"
        />
      </section>

      {notice !== null && (
        <p className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
          {notice}
        </p>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage-ink"
        >
          {error}
        </p>
      )}

      {text.trim() !== "" && parsed.length === 0 && (
        <p className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-muted">
          이름을 찾지 못했어요. 한 줄에 한 명씩 적거나 쉼표로 나눠주세요.
        </p>
      )}

      {parsed.length > 0 && (
        <>
          <section className="rounded-base border border-line bg-surface p-4">
            <h2 className="text-sm text-muted">미리보기</h2>
            <p className="num mt-1 text-base">{selected.length}명 등록 예정</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {STATUS_ORDER.filter((status) => counts.has(status)).map((status) => (
                <li key={status} className="num">
                  {STATUS_LABEL[status]} {counts.get(status) ?? 0}
                </li>
              ))}
            </ul>
          </section>

          {groups.map((group) => (
            <section key={group.label}>
              <h3 className="text-sm text-muted">{group.label}</h3>
              <ul className="mt-2 divide-y divide-line rounded-base border border-line bg-surface">
                {group.people.map((person) => {
                  const checked = isChecked(person);
                  return (
                    <li key={person.id} className="flex items-center gap-2 px-2 py-1">
                      {/* 체크박스 자체는 20px 이라 44px 라벨로 감싸 누를 곳을 넓힌다 */}
                      <label className="flex size-11 shrink-0 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={pending}
                          aria-label={`${nameOf(person)} 등록`}
                          onChange={(event) =>
                            setExcluded((prev) => ({
                              ...prev,
                              [person.id]: !event.target.checked,
                            }))
                          }
                          className="size-5"
                        />
                      </label>

                      <input
                        type="text"
                        value={nameOf(person)}
                        disabled={pending}
                        aria-label="이름"
                        onChange={(event) =>
                          setEdited((prev) => ({
                            ...prev,
                            [person.id]: event.target.value,
                          }))
                        }
                        className={`min-h-11 w-full min-w-0 rounded-base border px-3 font-display text-base ${
                          checked ? "border-line" : "border-transparent text-muted"
                        }`}
                      />

                      <span
                        className={`shrink-0 text-sm ${
                          !isEdited(person) && person.status === "needs_review"
                            ? "text-warn"
                            : "text-muted"
                        }`}
                      >
                        {/* 고친 이름에 원래 판정을 계속 붙이면 고쳐도 경고가 남는다 */}
                        {isEdited(person) ? "수정함" : STATUS_LABEL[person.status]}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {group.people.some((p) => p.status === "needs_review") && (
                <p className="mt-2 text-sm text-muted">
                  확인 필요는 이름이 아닌 것이 섞였을 때 표시돼요. 고쳐서 체크하거나
                  그대로 두면 등록되지 않아요.
                </p>
              )}
            </section>
          ))}

          {blocked !== null && (
            <p
              role="alert"
              className="rounded-base border border-line bg-warn-surface px-4 py-3 text-sm text-warn"
            >
              {blocked}
            </p>
          )}

          {!confirming && (
            <Button
              block
              disabled={pending || selected.length === 0 || blocked !== null}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              {selected.length}명 등록
            </Button>
          )}

          {confirming && (
            <section className="rounded-base border border-line bg-surface p-4">
              <p className="num text-base">{selected.length}명을 등록할까요?</p>
              <p className="mt-2 text-sm text-warn">
                등록한 사람은 지울 수 없어요. 이름과 조를 한 번 더 봐주세요.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                >
                  더 볼게요
                </Button>
                <Button disabled={pending} onClick={submit}>
                  등록
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
