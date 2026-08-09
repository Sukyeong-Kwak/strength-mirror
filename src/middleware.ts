import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지를 제외한 모든 경로.
     * 일반 사용자 경로에서도 세션 쿠키 갱신은 필요하다 (관리자가 앱을 쓰는 동안 만료되지 않게).
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
