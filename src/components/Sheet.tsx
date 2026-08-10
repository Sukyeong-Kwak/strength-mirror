"use client";

import { useEffect, useRef } from "react";

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** 아래에 붙는 버튼 줄 */
  footer?: React.ReactNode;
};

/**
 * 아래에서 올라오는 시트.
 *
 * 강점 설명과 사유 쓰기가 같은 껍데기를 쓴다. 화면을 갈아타지 않으므로
 * 설명을 보다가 닫으면 고르던 자리로 그대로 돌아온다.
 *
 * 넓은 화면에서는 가운데에 뜬다. 모바일에서 엄지로 닿는 자리에 두려고
 * 아래 붙임을 기본으로 삼았을 뿐, 큰 화면에서는 아래에 붙을 이유가 없다.
 */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // 시트 뒤의 목록이 같이 스크롤되면 어디를 보고 있었는지 잃는다
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-2 min-h-11 px-2 text-sm text-muted underline underline-offset-4"
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer !== undefined && (
          <div className="border-t border-line px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
