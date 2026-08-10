"use client"; // 에러 바운더리는 클라이언트 컴포넌트여야 한다

import { useEffect } from "react";

import { Button } from "@/components/Button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** 다시 불러온다. reset 과 달리 데이터를 새로 가져온다 */
  retry: () => void;
};

/**
 * 예상하지 못한 오류의 마지막 그물.
 *
 * 조회 실패를 삼키고 빈 화면을 보여주면 "아무것도 없음" 과 구분되지 않는다.
 * 그래서 조회 함수는 던지고, 여기서 받아 다시 시도할 길을 준다.
 *
 * 오류 원문은 보여주지 않는다. 서버에서 넘어온 메시지에는
 * 테이블 이름 같은 내부 사정이 들어 있을 수 있다.
 */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">잠시 문제가 생겼어요</h1>
      <p className="mt-2 text-sm text-muted">
        다시 눌러보시고, 계속 이러면 잠시 뒤에 열어주세요.
      </p>

      <div className="mt-6">
        <Button onClick={() => retry()}>다시 시도</Button>
      </div>

      {error.digest !== undefined && (
        <p className="num mt-6 text-sm text-muted">확인 번호 {error.digest}</p>
      )}
    </main>
  );
}
