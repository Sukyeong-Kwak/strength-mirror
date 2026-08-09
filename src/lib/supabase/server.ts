import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 서버 컴포넌트 · Server Action 용 클라이언트.
 *
 * 권한 판단은 전부 DB 의 RLS 가 한다. 이 클라이언트는 로그인 세션이 있으면
 * 그 세션으로, 없으면 anon 으로 조회할 뿐 특별한 권한을 갖지 않는다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
          // 세션 갱신은 미들웨어가 담당하므로 여기서는 무시해도 된다.
        }
      },
    },
  });
}
