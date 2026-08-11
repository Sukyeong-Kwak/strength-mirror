import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClass } from "@/components/Button";
import { StrengthBoard } from "@/features/feedback/StrengthBoard";
import { getPerson } from "@/lib/data/people";
import { toGroupLabel } from "@/lib/groups";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 이름이 브라우저 기록과 공유 미리보기에 남지 않게 한다.
 * 누가 누구에게 남기는지가 주소창 밖으로 새어나갈 이유가 없다.
 */
export const metadata: Metadata = {
  title: "강점 발굴",
  robots: { index: false, follow: false },
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;

  // 잘못된 주소를 그대로 조회에 넣으면 Postgres 가 uuid 형식 오류를 던진다.
  // 없는 사람과 같은 화면을 보여준다
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const person = await getPerson(id);
  if (person === null) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href="/" className={buttonClass("secondary", false, "sm")}>
        명단으로
      </Link>

      <h1 className="mt-4 text-2xl">{person.name}</h1>
      <p className="mt-1 text-sm text-muted">{toGroupLabel(person.groupName)}</p>

      <StrengthBoard person={person} />

      {/*
        결과는 모두가 5개씩 받은 뒤에 열린다. 잠겨 있을 때도 링크를 숨기지 않는다.
        숨기면 "왜 결과가 없는지" 를 물어볼 곳이 사라진다. 눌러 들어가면
        무엇을 기다리는 중인지 알려준다
      */}
      <div className="mt-10 border-t border-line pt-6">
        <Link href={`/p/${person.id}/result`} className={buttonClass("secondary", false, "sm")}>
          {person.name}님이 받은 강점 보기
        </Link>
      </div>
    </main>
  );
}
