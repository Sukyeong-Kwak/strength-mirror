import { Suspense } from "react";

import { DemoBanner } from "@/components/DemoBanner";
import { getEventById } from "@/lib/data/events";
import { getPerson } from "@/lib/data/people";

type PersonLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 개인 화면의 바깥 틀. 그 사람이 예시 그룹이면 안내 띠를 위에 둔다.
 *
 * 레이아웃이 DB 를 기다리면 그동안 loading.tsx 도 뜨지 못해 클릭이 멈춘 듯 보인다.
 * 그래서 띠만 Suspense 안에서 따로 그린다.
 * 없는 사람의 404 는 각 페이지가 정한다.
 * getPerson · getEventById 는 cache() 라 페이지와 조회를 나눠 쓴다.
 */
export default function PersonLayout({ children, params }: PersonLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <PersonBanner params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function PersonBanner({ params }: Pick<PersonLayoutProps, "params">) {
  const { id } = await params;
  const person = UUID.test(id) ? await getPerson(id) : null;
  const event = person === null ? null : await getEventById(person.eventId);
  return event?.isSample === true ? <DemoBanner /> : null;
}
