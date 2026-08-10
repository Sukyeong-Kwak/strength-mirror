import { formatRelativeTime } from "@/lib/time";
import type {
  AdminAction,
  AdminActivity,
  AdminActivityDetail,
} from "@/types/domain";

type RecentActivityProps = {
  entries: readonly AdminActivity[];
  /** 이메일 → 표시 이름 */
  labels: ReadonlyMap<string, string>;
};

const ACTION_LABEL: Record<AdminAction, string> = {
  login: "로그인",
  import_people: "명단 등록",
  exclude_feedback: "제출 제외",
  restore_feedback: "제외 되돌림",
  add_admin: "관리자 추가",
  remove_admin: "관리자 제거",
  hide_person: "명단에서 숨김",
  restore_person: "숨김 되돌림",
  delete_person: "명단에서 삭제",
};

/** detail 은 jsonb 라 무엇이든 올 수 있다. 좁혀서 쓴다 */
function readField(detail: AdminActivityDetail, key: string): unknown {
  if (detail === null || typeof detail !== "object" || Array.isArray(detail)) {
    return undefined;
  }
  return detail[key];
}

function readCount(detail: AdminActivityDetail): number | null {
  const value = readField(detail, "count");
  return typeof value === "number" ? value : null;
}

function readName(detail: AdminActivityDetail): string | null {
  const value = readField(detail, "name");
  return typeof value === "string" && value !== "" ? value : null;
}

function describe(entry: AdminActivity): string {
  const base = ACTION_LABEL[entry.action];

  const count = readCount(entry.detail);
  if (count !== null) {
    return `${count}명 ${base}`;
  }

  // 사람을 숨기거나 지운 기록은 누구였는지가 핵심이다
  const name = readName(entry.detail);
  return name === null ? base : `${name} ${base}`;
}

/** 건수가 붙은 문구는 숫자 폭이 흔들리지 않게 한다 */
function hasCount(entry: AdminActivity): boolean {
  return readCount(entry.detail) !== null;
}

/**
 * 최근 활동.
 * 관리자가 여러 명이라 누가 무엇을 했는지 보여줘야 같은 일을 두 번 하지 않는다.
 */
export function RecentActivity({ entries, labels }: RecentActivityProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">
      <h2 className="text-sm text-muted">최근 활동</h2>
      <ul className="mt-3 divide-y divide-line rounded-base border border-line bg-surface text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-wrap gap-x-2 px-3 py-2">
            <span>{labels.get(entry.adminEmail) ?? entry.adminEmail}</span>
            <span className="text-muted">·</span>
            <span className={hasCount(entry) ? "num" : undefined}>
              {describe(entry)}
            </span>
            <span className="text-muted">·</span>
            <span className="text-muted">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
