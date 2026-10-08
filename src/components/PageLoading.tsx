/**
 * 화면을 불러오는 동안 보이는 뼈대. 각 경로의 loading.tsx 가 그린다.
 *
 * 서버가 DB 를 다녀오는 동안 아무 변화가 없으면 "눌렸나?" 하고 다시 누르게 된다.
 * 누르자마자 화면이 바뀌어 눌렸다는 것을 알려준다.
 * 글자 대신 회색 막대를 둔다 — 어느 화면이 열릴지 모르는 채로 쓰는 공용 틀이라
 * 틀린 제목을 잠깐이라도 보여주지 않는다.
 */
export function PageLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6" aria-busy="true">
      <p role="status" className="sr-only">
        불러오는 중이에요
      </p>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-24 rounded-base bg-line" />
        <div className="mt-5 h-7 w-48 rounded-base bg-line" />
        <div className="mt-3 h-4 w-32 rounded-base bg-line" />
        <div className="mt-8 h-28 w-full rounded-base bg-line" />
        <div className="mt-4 h-28 w-full rounded-base bg-line" />
      </div>
    </main>
  );
}
