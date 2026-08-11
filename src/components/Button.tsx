export type ButtonVariant = "primary" | "secondary" | "quiet";

/**
 * 버튼 크기 — 중요도 세 단계.
 *
 * 전에는 두 단계였는데 높이가 둘 다 44px 이라 실제로는 글자만 달랐다.
 * 그래서 "24가지 강점 보기" 같은 곁가지 이동이 이 화면에서 해야 할 일과
 * 똑같은 덩치로 앉아 있었다. 화면을 열었을 때 무엇부터 눌러야 하는지는
 * 글자 크기가 아니라 덩치로 먼저 읽힌다.
 *
 *   lg (52px)  이 화면에서 해야 할 그 일. 한 화면에 하나 — 저장·확인·로그인
 *   md (44px)  기본. 고르는 것들 (조 거르기, 관리자 메뉴)
 *   sm (36px)  곁가지 이동과 잔 동작 — 돌아가기, 다른 화면 보기, 닫기, 지우기
 *
 * 36px 은 손가락으로 누르는 최소치(WCAG 2.5.8 은 24px)를 넘는다. 여기서 더
 * 줄이지 말 것. 작게 만드는 목적은 누르기 어렵게 하는 것이 아니라
 * 눈이 먼저 가지 않게 하는 것이다.
 */
export type ButtonSize = "lg" | "md" | "sm";

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
  "inline-flex items-center justify-center rounded-base border transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "border-ink bg-ink text-surface",
  secondary: "border-line bg-surface text-ink",
  quiet: "border-transparent bg-transparent text-muted",
};

// 높이는 여기서만 정한다. BASE 에 두면 크기를 골라도 덩치가 안 바뀐다
const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: "min-h-13 px-5 text-base",
  md: "min-h-11 px-4 text-base",
  sm: "min-h-9 px-3 text-sm",
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
 *
 * 크기는 부르는 쪽이 정한다. 참여자 화면의 조 거르기는 명단을 좁히는 첫 단계라
 * 기본 크기(md)로 두고, 관리자 화면의 조 거르기는 표를 보는 곁가지라 작다(sm).
 */
export function Chip({
  children,
  pressed,
  onClick,
  size = "sm",
}: {
  children: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
  size?: ButtonSize;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`${buttonClass(pressed ? "primary" : "secondary", false, size)} shrink-0`}
    >
      {children}
    </button>
  );
}
