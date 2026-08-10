export type ButtonVariant = "primary" | "secondary" | "quiet";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  /** 폭을 꽉 채울 때 */
  block?: boolean;
  className?: string;
  ariaLabel?: string;
};

// 그림자·그라데이션 없이 면과 경계선만으로 구분한다 (6-4)
const BASE =
  "inline-flex min-h-11 items-center justify-center rounded-base border px-4 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "border-ink bg-ink text-surface",
  secondary: "border-line bg-surface text-ink",
  quiet: "border-transparent bg-transparent text-muted",
};

/**
 * 버튼 모양을 문자열로 돌려준다.
 *
 * 링크(`next/link`)를 버튼처럼 보이게 할 때 쓴다. Button 컴포넌트를 쓸 수 없는 것은
 * 링크는 button 이 아니라 a 여야 하기 때문이다. 눌렀을 때 이동하는 것과
 * 동작하는 것은 다르고, 그 차이는 스크린리더와 새 탭 열기에서 드러난다.
 *
 * 클래스 문자열을 화면마다 베껴 쓰면 버튼 모양을 바꿀 때 링크만 옛 모양으로 남는다.
 */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  block = false,
): string {
  return `${BASE} ${VARIANT_CLASS[variant]} ${block ? "w-full" : ""}`;
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  block = false,
  className = "",
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${BASE} ${VARIANT_CLASS[variant]} ${block ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
