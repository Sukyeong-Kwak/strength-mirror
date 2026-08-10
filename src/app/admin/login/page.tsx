import { redirect } from "next/navigation";

import { LoginPanel } from "@/features/admin/LoginPanel";
import { getAdminSession } from "@/lib/auth/admin";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "접근 권한이 없는 계정이에요",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 열린 리다이렉트를 막는다. 관리자 경로가 아니면 무시한다 */
function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return "/admin";
  }
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

function firstString(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const session = await getAdminSession();
  if (session !== null) {
    redirect(next);
  }

  const errorKey = firstString(params.error);
  const initialError =
    errorKey === null ? null : (ERROR_MESSAGES[errorKey] ?? "로그인하지 못했어요");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl">관리자 로그인</h1>
      <p className="mt-2 text-sm text-muted">
        명단 등록과 현황 확인은 관리자만 할 수 있어요.
      </p>

      <div className="mt-8">
        <LoginPanel next={next} initialError={initialError} />
      </div>
    </main>
  );
}
