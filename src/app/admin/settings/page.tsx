import { redirect } from "next/navigation";

import {
  AdminAllowlist,
  type AdminEntry,
} from "@/features/admin/AdminAllowlist";
import { AdminShell } from "@/features/admin/AdminShell";
import { getAdminSession } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (session === null) {
    redirect("/admin/login?error=forbidden&next=%2Fadmin%2Fsettings");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_allowlist")
    .select("email, label, added_by, created_at")
    .order("created_at", { ascending: true });

  const entries: AdminEntry[] = (data ?? []).map((row) => ({
    email: row.email,
    label: row.label,
    addedBy: row.added_by,
    createdAt: row.created_at,
  }));

  return (
    <AdminShell session={session} title="관리자 관리" backHref="/admin">
      <AdminAllowlist entries={entries} currentEmail={session.email} />
    </AdminShell>
  );
}
