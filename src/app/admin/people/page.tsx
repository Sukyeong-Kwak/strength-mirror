import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleManager } from "@/features/admin/PeopleManager";
import { getReceiptTotals, requireAdmin } from "@/lib/auth/dal";
import { getAppMode, inMode } from "@/lib/data/appState";

export default async function AdminPeoplePage() {
  const session = await requireAdmin();
  const [everyone, mode] = await Promise.all([getReceiptTotals(), getAppMode()]);
  // 지금 참여자 화면에 보이는 쪽만 다룬다. 등록도 그쪽으로 들어간다
  const people = everyone.filter((row) => inMode(row.isDemo, mode));

  return (
    <AdminShell session={session} title="명단 관리" backHref="/admin">
      <PeopleManager people={people} mode={mode} />
    </AdminShell>
  );
}
