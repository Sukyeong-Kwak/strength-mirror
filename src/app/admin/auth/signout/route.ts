import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 로그인 화면에 넘길 수 있는 사유.
 * 쿼리로 들어온 문자열을 그대로 싣지 않는다.
 */
const ALLOWED_REASONS = new Set(["forbidden"]);

/**
 * 세션을 서버에서 끊는다.
 *
 * 서버 컴포넌트는 쿠키를 쓸 수 없어서 스스로 로그아웃시킬 수 없다.
 * 허용목록에 없는 계정을 만나면 이 라우트로 보내 세션을 지운다.
 * "화면에서 안내하고 클라이언트가 로그아웃하겠지" 에 기대지 않기 위해서다.
 *
 * 셸의 로그아웃 버튼은 Server Action(logoutAdmin)을 쓴다.
 * Server Action 은 쿠키를 쓸 수 있어서 이 라우트가 필요 없다.
 */
export async function GET(request: NextRequest): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("reason");
  const query =
    reason !== null && ALLOWED_REASONS.has(reason) ? `?error=${reason}` : "";

  // redirect 는 예외를 던지므로 try 안에서 부르지 않는다
  redirect(`/admin/login${query}`);
}
