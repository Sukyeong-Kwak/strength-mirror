"use client";

import { Button } from "@/components/Button";
import { saveMe } from "@/lib/submitted";
import { useMe } from "@/lib/useLocalStore";

/**
 * "내 이름이에요" — 홈의 '내 강점' 칸이 이 사람을 바로 열게 한다.
 *
 * 이 기기에만 기억한다. 서버는 누가 누구인지 모른다.
 */
export function MeToggle({ personId }: { personId: string }) {
  const me = useMe();

  if (me === personId) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        내 이름으로 기억해뒀어요. 아래에 내가 남긴 강점이 보여요.
        <Button variant="quiet" size="sm" onClick={() => saveMe(null)}>
          해제
        </Button>
      </p>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => saveMe(personId)}>
      내 이름이에요 · 내가 남긴 강점도 보기
    </Button>
  );
}
