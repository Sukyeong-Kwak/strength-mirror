import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleManager } from "@/features/admin/PeopleManager";
import { getReceiptTotals, requireAdmin } from "@/lib/auth/dal";

export default async function AdminPeoplePage() {
  const session = await requireAdmin();
  const people = await getReceiptTotals();

  return (
    <AdminShell session={session} title="명단 관리" backHref="/admin">
      <PeopleManager people={people} />
    </AdminShell>
  );
}
