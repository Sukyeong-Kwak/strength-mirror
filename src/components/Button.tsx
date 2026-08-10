export type ButtonVariant = "primary" | "secondary" | "quiet";

/**
 * 버튼 크기.
 *
 * 시트 머리글의 "닫기" 나 목록 옆의 잔 동작까지 본문 크기로 두면
 * 정작 눌러야 할 기본 동작보다 커 보인다. 모양(테두리·모서리·최소 높이)은
 * 그대로 두고 글자와 좌우 여백만 줄인다.
 */
export type ButtonSize = "md" | "sm";

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
  "inline-flex min-h-11 items-center justify-center rounded-base border transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "border-ink bg-ink text-surface",
  secondary: "border-line bg-surface text-ink",
  quiet: "border-transparent bg-transparent text-muted",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "px-4 text-base",
  sm: "px-3 text-sm",
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
  size: ButtonSize = "md",
): string {
  return `${BASE} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${block ? "w-full" : ""}`;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
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
      className={`${buttonClass(variant, block, size)} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * 고르는 칩 (조 거르기 등).
 *
 * 누르면 다른 화면으로 가는 버튼이 아니라 지금 무엇을 보고 있는지 나타내는
 * 상태 표시다. 그래서 Button 과 달리 `pressed` 를 받아 읽는 프로그램에도
 * 눌린 상태를 알린다. 모양은 같은 BASE 를 써서 버튼과 따로 놀지 않게 한다.
 */
export function Chip({
  children,
  pressed,
  onClick,
}: {
  children: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`${buttonClass(pressed ? "primary" : "secondary", false, "sm")} shrink-0`}
    >
      {children}
    </button>
  );
}
