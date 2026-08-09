import { formatRelativeTime } from "@/lib/time";
import type { Database } from "@/types/database";
import type { AdminAction } from "@/types/domain";

type Json = Database["public"]["Tables"]["admin_audit_log"]["Row"]["detail"];

export type ActivityEntry = {
  id: number;
  adminEmail: string;
  action: AdminAction;
  detail: Json;
  createdAt: string;
};

type RecentActivityProps = {
  entries: readonly ActivityEntry[];
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
};

/** detail 은 jsonb 라 무엇이든 올 수 있다. 좁혀서 쓴다 */
function readCount(detail: Json): number | null {
  if (detail === null || typeof detail !== "object" || Array.isArray(detail)) {
    return null;
  }
  const value = detail["count"];
  return typeof value === "number" ? value : null;
}

function describe(entry: ActivityEntry): string {
  const base = ACTION_LABEL[entry.action];
  const count = readCount(entry.detail);
  return count === null ? base : `${count}명 ${base}`;
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
            <span>{describe(entry)}</span>
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
