import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** 로그인 없이 들어갈 수 있는 관리자 경로 */
const ADMIN_PUBLIC_PATHS = ["/admin/login", "/admin/auth"] as const;

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * 세션 쿠키를 갱신하고 /admin/* 접근을 1차로 막는다.
 *
 * 여기서 확인하는 것은 "로그인했는가" 까지다.
 * 관리자인지(허용목록에 있는지)는 lib/auth/dal 의 requireAdmin() 과 RLS 가 판단한다.
 * 미들웨어는 Server Action 을 거치지 않으므로 이것만 믿어서는 안 된다.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() 를 호출해야 만료된 세션이 갱신된다. getSession() 은 쿠키를 그대로 믿으므로 쓰지 않는다
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !isAdminPublicPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
