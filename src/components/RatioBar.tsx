import { BAR_STAGGER_MS, BAR_DURATION_MS } from "@/lib/constants";
import { VIRTUE_META, type VirtueCode } from "@/lib/strengths";

/**
 * 비율 막대 (7-1).
 *
 * 숫자는 5% 눈금으로 이미 내려온 값이다. 여기서 다시 반올림하지 않는다.
 *
 * 이름과 퍼센트를 막대 위에 글자로 함께 둔다. 색만으로 읽게 하면
 * 절제 색(#00af50)이 흰 배경에서 2.9:1 이라 막대 자체가 잘 보이지 않고,
 * 색약이 있는 사람은 이웃한 덕목을 구분하지 못한다.
 *
 * index 는 막대가 차례로 자라게 하는 데만 쓴다 (6-5).
 */
export function RatioBar({
  nameKo,
  ratio,
  virtue,
  index = 0,
}: {
  nameKo: string;
  ratio: number;
  virtue: VirtueCode;
  index?: number;
}) {
  const meta = VIRTUE_META[virtue];

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-base">{nameKo}</span>
        <span className="num shrink-0 text-sm text-muted">{ratio}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-page">
        <div
          className={`bar-grow h-2 rounded-full ${meta.barClass}`}
          style={{
            width: `${ratio}%`,
            animationDelay: `${index * BAR_STAGGER_MS}ms`,
            animationDuration: `${BAR_DURATION_MS}ms`,
          }}
        />
      </div>
    </li>
  );
}

/**
 * 덕목 6색 스택 막대.
 *
 * 한 줄에 100%를 다 담아 어느 덕목으로 기울어 있는지 한눈에 보여준다.
 * 구간이 좁으면 안에 글자를 넣을 수 없으므로 아래 범례가 본문 역할을 한다.
 * 그래서 스택 자체는 읽는 프로그램에서 숨기고 범례만 읽히게 둔다.
 */
export function VirtueStack({
  rows,
}: {
  rows: readonly { virtue: VirtueCode; ratio: number }[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-page" aria-hidden>
      {rows.map((row) => (
        <div
          key={row.virtue}
          className={VIRTUE_META[row.virtue].barClass}
          style={{ width: `${row.ratio}%` }}
        />
      ))}
    </div>
  );
}
