import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession, writeAuditLog } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** 열린 리다이렉트를 막는다 */
function safeNext(value: string | null): string {
  if (value === null) {
    return "/admin";
  }
  return value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

/**
 * 구글 OAuth 콜백.
 *
 * 세션을 만든 뒤 허용목록을 확인하고, 없으면 즉시 로그아웃시킨다.
 * 어떤 이메일이 허용목록에 있는지는 알려주지 않는다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code === null) {
    return NextResponse.redirect(`${origin}/admin/login?error=oauth`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=oauth`);
  }

  const session = await getAdminSession();
  if (session === null) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=forbidden`);
  }

  await writeAuditLog(supabase, session.email, "login");

  return NextResponse.redirect(`${origin}${next}`);
}
