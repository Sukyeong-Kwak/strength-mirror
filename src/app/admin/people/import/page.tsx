import { AdminShell } from "@/features/admin/AdminShell";
import { PeopleImportPanel } from "@/features/admin/PeopleImportPanel";
import { getPeopleForDedupe, requireAdmin } from "@/lib/auth/dal";
import { getAppMode } from "@/lib/data/appState";

export default async function PeopleImportPage() {
  const session = await requireAdmin();
  const [existing, mode] = await Promise.all([getPeopleForDedupe(), getAppMode()]);

  return (
    <AdminShell session={session} title="명단 등록" backHref="/admin">
      {mode === "demo" && (
        <p className="mt-4 rounded-base border border-line bg-warn-surface px-4 py-3 text-sm text-warn">
          지금은 예시 화면이에요. 여기서 등록하면 예시 인물로 들어가요. 실제 명단을 넣으려면
          관리자 홈에서 실제 참여로 바꾼 뒤 등록해주세요.
        </p>
      )}
      <PeopleImportPanel existing={existing} />
    </AdminShell>
  );
}
