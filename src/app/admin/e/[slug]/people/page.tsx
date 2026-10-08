import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleManager } from "@/features/admin/PeopleManager";
import { getReceiptTotals, requireAdminEvent } from "@/lib/auth/dal";
import { adminEventHref } from "@/lib/eventSlug";

type AdminPeoplePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminPeoplePage({ params }: AdminPeoplePageProps) {
  const { slug } = await params;
  const { session, event } = await requireAdminEvent(slug);
  const people = await getReceiptTotals(event.id);

  return (
    <AdminShell
      session={session}
      title={`명단 관리 · ${event.title}`}
      backHref={adminEventHref(event.slug)}
      backLabel="그룹 관리로"
    >
      <PeopleManager event={event} people={people} />
    </AdminShell>
  );
}
