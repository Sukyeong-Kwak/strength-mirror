import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  title: "강점 남기기",
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
      <Link
        href="/"
        className="inline-block min-h-11 py-3 text-sm text-muted underline underline-offset-4"
      >
        명단으로
      </Link>

      <h1 className="mt-2 text-2xl">{person.name}</h1>
      <p className="mt-1 text-sm text-muted">{toGroupLabel(person.groupName)}</p>

      <StrengthBoard person={person} />
    </main>
  );
}
