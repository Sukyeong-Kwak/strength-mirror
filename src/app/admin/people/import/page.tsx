import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleImportPanel } from "@/features/admin/PeopleImportPanel";
import { getPeopleForDedupe, requireAdmin } from "@/lib/auth/dal";

export default async function PeopleImportPage() {
  const session = await requireAdmin();
  const existing = await getPeopleForDedupe();

  return (
    <AdminShell session={session} title="명단 등록" backHref="/admin">
      <PeopleImportPanel existing={existing} />
    </AdminShell>
  );
}
