const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 상대 시간. "3일 전" 처럼 짧게 쓴다.
 * now 를 인자로 받아 테스트 가능하게 둔다.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const diff = now.getTime() - then;
  if (diff < MINUTE) {
    return "방금";
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}분 전`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}시간 전`;
  }
  if (diff < 30 * DAY) {
    return `${Math.floor(diff / DAY)}일 전`;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(then);
}
