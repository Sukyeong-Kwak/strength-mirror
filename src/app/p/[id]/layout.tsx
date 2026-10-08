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
 * 없는 사람의 404 는 각 페이지가 정한다. 여기서는 띠만 그리고 비켜선다.
 * getPerson · getEventById 는 cache() 라 페이지와 조회를 나눠 쓴다.
 */
export default async function PersonLayout({ children, params }: PersonLayoutProps) {
  const { id } = await params;
  const person = UUID.test(id) ? await getPerson(id) : null;
  const event = person === null ? null : await getEventById(person.eventId);

  return (
    <>
      {event?.isSample === true && <DemoBanner />}
      {children}
    </>
  );
}
