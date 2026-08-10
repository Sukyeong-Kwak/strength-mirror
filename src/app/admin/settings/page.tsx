import { AdminAllowlist } from "@/features/admin/AdminAllowlist";
import { AdminShell } from "@/features/admin/AdminShell";
import { getAdminAllowlist, requireAdmin } from "@/lib/auth/dal";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const entries = await getAdminAllowlist();

  return (
    <AdminShell session={session} title="관리자 관리" backHref="/admin">
      <AdminAllowlist entries={entries} currentEmail={session.email} />
    </AdminShell>
  );
}
