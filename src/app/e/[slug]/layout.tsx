import { notFound } from "next/navigation";

import { DemoBanner } from "@/components/DemoBanner";
import { getEventBySlug } from "@/lib/data/events";

type EventLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

/**
 * 그룹 화면의 바깥 틀.
 *
 * 없는 그룹이면 여기서 404 로 끝낸다. 예시 그룹이면 안내 띠를 위에 둔다.
 * 아래 페이지도 같은 그룹을 다시 묻지만 getEventBySlug 가 cache() 라 조회는 한 번이다.
 * (레이아웃이 막아도 페이지는 따로 실행되므로, 페이지도 스스로 notFound 를 부른다)
 */
export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (event === null) {
    notFound();
  }

  return (
    <>
      {event.isSample && <DemoBanner />}
      {children}
    </>
  );
}
