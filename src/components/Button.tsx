type ButtonVariant = "primary" | "secondary" | "quiet";

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
