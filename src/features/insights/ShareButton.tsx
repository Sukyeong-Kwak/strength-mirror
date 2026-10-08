"use client";

import { useState } from "react";

import { Button } from "@/components/Button";

type ShareButtonProps = {
  title: string;
  /** 보낼 주소. 비우면 지금 화면. '/e/oikos' 처럼 사이트 안의 경로를 준다 */
  path?: string;
  label?: string;
  size?: "md" | "sm";
};

/**
 * 링크를 보낸다. 기본은 지금 화면의 링크다.
 *
 * 휴대폰은 공유 시트(navigator.share)를 띄우고, 없으면 링크를 복사한다.
 * 공유 시트를 닫은 것도 오류로 오므로 그때는 아무 말도 하지 않는다.
 */
export function ShareButton({ title, path, label = "링크 보내기", size = "md" }: ShareButtonProps) {
  const [notice, setNotice] = useState<string | null>(null);

  async function share() {
    const url =
      path === undefined ? window.location.href : new URL(path, window.location.origin).href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // 닫았거나 막혔다
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice("링크를 복사했어요");
    } catch {
      setNotice("복사하지 못했어요. 주소창의 링크를 직접 복사해주세요");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size={size} onClick={share}>
        {label}
      </Button>
      {notice !== null && (
        <p role="status" className="text-sm text-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
