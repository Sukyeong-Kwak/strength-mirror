"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/Button";

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
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * onClose 는 부모가 다시 그릴 때마다 새 함수다.
   * 이것을 아래 효과의 의존성에 두면 시트 안에서 글자 하나를 칠 때마다
   * 효과가 다시 돌아 포커스를 시트로 되돌린다. 그러면 입력칸에 글이 안 써진다.
   * 최신 함수는 ref 로 들고, 효과는 열고 닫힘에만 반응하게 한다.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // 시트 뒤의 목록이 같이 스크롤되면 어디를 보고 있었는지 잃는다
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 열기 전에 보던 자리로 닫을 때 돌아가려고 기억해 둔다
    const opener = document.activeElement;
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // 누른 버튼이 그새 사라졌거나 잠겼으면 그냥 둔다
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [open]);

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

      {/*
        포커스를 시트 자체에 준다. 안의 입력칸을 가로채지 않으면서
        읽는 프로그램에는 시트가 열렸다고 알리고, Tab 도 시트 안에서 이어진다
      */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg">{title}</h2>
          <Button variant="secondary" size="sm" onClick={onClose} className="shrink-0">
            닫기
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer !== undefined && (
          <div className="border-t border-line px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
