"use client";

import { Sheet } from "@/components/Sheet";
import { StrengthBody } from "@/features/strengths/StrengthBody";
import type { StrengthDef } from "@/lib/strengths";

type StrengthInfoProps = {
  strength: StrengthDef | null;
  onClose: () => void;
};

/**
 * 강점 설명 시트.
 *
 * 24개를 한 번에 다 읽게 하지 않는다. 고르다가 궁금한 것만 열어 본다.
 * 화면을 갈아타지 않으므로 닫으면 보던 자리로 그대로 돌아온다.
 */
export function StrengthInfo({ strength, onClose }: StrengthInfoProps) {
  return (
    <Sheet open={strength !== null} title={strength?.nameKo ?? ""} onClose={onClose}>
      {strength !== null && <StrengthBody strength={strength} />}
    </Sheet>
  );
}
