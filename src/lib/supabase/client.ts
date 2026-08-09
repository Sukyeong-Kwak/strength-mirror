import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 브라우저용 클라이언트.
 *
 * 일반 사용자는 로그인하지 않으므로 anon 키로 동작하고,
 * 관리자 로그인 이후에는 같은 클라이언트가 세션 쿠키를 들고 다닌다.
 * service_role 키는 이 앱 어디에서도 쓰지 않는다.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
