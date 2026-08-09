/**
 * 환경변수 접근. 값이 없으면 화면이 조용히 깨지는 대신 즉시 알린다.
 *
 * Next 는 `process.env.NEXT_PUBLIC_*` 를 빌드 시점에 치환하므로
 * 반드시 프로퍼티를 직접 적어야 한다. 변수로 우회하면 치환되지 않는다.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`환경변수 ${name} 가 비어 있어요. .env.local 을 확인하세요`);
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
