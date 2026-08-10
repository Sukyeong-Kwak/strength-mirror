import Link from "next/link";

import { logoutAdmin } from "@/actions/admin/logout";
import { Button, buttonClass } from "@/components/Button";
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
          <Button type="submit" variant="secondary" size="sm">
            로그아웃
          </Button>
        </form>
      </header>

      {backHref !== undefined && (
        <Link href={backHref} className={`mt-4 ${buttonClass("secondary", false, "sm")}`}>
          관리자 홈으로
        </Link>
      )}

      {/* 표제 서체는 globals.css 의 h1 규칙이 붙인다 */}
      <h1 className="mt-4 text-2xl">{title}</h1>

      {children}
    </div>
  );
}
