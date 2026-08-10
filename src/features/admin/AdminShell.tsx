import Link from "next/link";

import { logoutAdmin } from "@/actions/admin/logout";
import { adminDisplayName, type AdminSession } from "@/lib/auth/admin";

type AdminShellProps = {
  session: AdminSession;
  title: string;
  /** 관리자 홈이 아닐 때 돌아갈 링크를 둔다 */
  backHref?: string;
  children: React.ReactNode;
};

export function AdminShell({
  session,
  title,
  backHref,
  children,
}: AdminShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <p className="text-sm text-muted">
          {adminDisplayName(session)}님으로 로그인 중
        </p>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="min-h-11 px-2 text-sm text-muted underline underline-offset-4"
          >
            로그아웃
          </button>
        </form>
      </header>

      {backHref !== undefined && (
        <Link
          href={backHref}
          className="mt-4 inline-block min-h-11 py-3 text-sm text-muted underline underline-offset-4"
        >
          관리자 홈으로
        </Link>
      )}

      {/* 고운바탕은 사람 이름과 강점 이름에만 쓴다 (6-3) */}
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>

      {children}
    </div>
  );
}
