import { createSupabaseServerClient } from "@/lib/supabase/server";

// 8단계에서 사람 목록으로 교체될 임시 화면.
// 지금은 서버 컴포넌트 → Supabase → RLS 경로가 살아 있는지 확인하는 용도다.
export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const [strengths, status] = await Promise.all([
    supabase.from("strengths").select("code"),
    supabase.from("results_status").select("unlocked, remaining").maybeSingle(),
  ]);

  const error = strengths.error ?? status.error;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">강점 남기기</h1>
      <p className="mt-2 text-sm text-muted">
        준비 중인 화면이에요. 8단계에서 사람 목록으로 바뀝니다.
      </p>

      <dl className="mt-6 divide-y divide-line rounded-base border border-line bg-surface text-sm">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-muted">등록된 강점</dt>
          <dd className="num">{strengths.data?.length ?? 0}개</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-muted">결과 공개</dt>
          <dd>{status.data?.unlocked === true ? "열림" : "잠김"}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-muted">남은 사람</dt>
          <dd className="num">{status.data?.remaining ?? 0}명</dd>
        </div>
      </dl>

      {error !== null && (
        <p className="mt-4 rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage">
          연결에 실패했어요. {error.message}
        </p>
      )}
    </main>
  );
}
