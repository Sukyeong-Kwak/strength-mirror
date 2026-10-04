"use client";

import { usePathname } from "next/navigation";

/**
 * 예시 화면 안내 띠.
 *
 * 예시 인물을 실제 사람으로 착각하고 진지하게 글을 남기는 일이 없게,
 * 참여자 화면 맨 위에 늘 보이게 둔다. 관리자 화면에는 따로 안내가 있어 뺀다.
 */
export function DemoBanner() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }
  return (
    <div className="border-b border-line bg-warn-surface px-4 py-2 text-center text-sm text-warn">
      지금은 예시 화면이에요. 마음껏 눌러보세요 — 진행자가 시작하면 실제 명단으로 바뀌어요.
    </div>
  );
}
