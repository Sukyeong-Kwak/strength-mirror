import { Suspense } from "react";

import { DemoBanner } from "@/components/DemoBanner";
import { getEventBySlug } from "@/lib/data/events";

type EventLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

/**
 * 그룹 화면의 바깥 틀. 예시 그룹이면 안내 띠를 위에 둔다.
 *
 * 레이아웃이 DB 를 기다리면 그동안 loading.tsx 도 뜨지 못해 클릭이 멈춘 듯 보인다.
 * 그래서 띠만 Suspense 안에서 따로 그리고, 레이아웃 자신은 아무것도 기다리지 않는다.
 * 없는 그룹의 404 는 각 페이지가 스스로 낸다.
 * 띠와 페이지가 같은 그룹을 묻지만 getEventBySlug 가 cache() 라 조회는 한 번이다.
 */
export default function EventLayout({ children, params }: EventLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <EventBanner params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function EventBanner({ params }: Pick<EventLayoutProps, "params">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return event?.isSample === true ? <DemoBanner /> : null;
}
