import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleImportPanel } from "@/features/admin/PeopleImportPanel";
import { getPeopleForDedupe, requireAdminEvent } from "@/lib/auth/dal";
import { adminEventHref } from "@/lib/eventSlug";

type PeopleImportPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PeopleImportPage({ params }: PeopleImportPageProps) {
  const { slug } = await params;
  const { session, event } = await requireAdminEvent(slug);
  const existing = await getPeopleForDedupe(event.id);

  return (
    <AdminShell
      session={session}
      title={`명단 등록 · ${event.title}`}
      backHref={adminEventHref(event.slug)}
      backLabel="그룹 관리로"
    >
      <PeopleImportPanel eventId={event.id} existing={existing} />
    </AdminShell>
  );
}
