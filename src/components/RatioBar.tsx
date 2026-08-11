import { BAR_STAGGER_MS, BAR_DURATION_MS } from "@/lib/constants";
import {
  buildDonut,
  DONUT_CX,
  DONUT_CY,
  DONUT_HEIGHT,
  DONUT_R,
  DONUT_STROKE,
  DONUT_WIDTH,
} from "@/lib/donut";
import { VIRTUE_META, type VirtueCode } from "@/lib/strengths";
import type { VirtueRatioRow } from "@/types/domain";

/**
 * 비율 막대 (7-1).
 *
 * 숫자는 5% 눈금으로 이미 내려온 값이다. 여기서 다시 반올림하지 않는다.
 *
 * 이름과 퍼센트를 막대와 한 줄에 둔다. 색만으로 읽게 하면
 * 절제 색(#00af50)이 흰 배경에서 2.9:1 이라 막대 자체가 잘 보이지 않고,
 * 색약이 있는 사람은 이웃한 덕목을 구분하지 못한다.
 *
 * 전에는 이름을 막대 위에 얹어 두 줄이었다. 한 줄에 모은 이유는 두 가지다.
 * 하나는 높이 — 한 칸이 50px 에서 30px 로 줄어 열 줄이 한 화면에 들어온다.
 * 다른 하나가 더 중요한데, 두 줄짜리는 막대와 막대 사이에 글줄이 끼어
 * 길이를 견줄 수 없다. 막대 차트를 쓰는 이유가 길이 비교인데 그것이 안 됐다.
 * 이제 막대들이 같은 세로선에서 시작해 계단으로 읽힌다.
 *
 * index 는 막대가 차례로 자라게 하는 데만 쓴다 (6-5).
 */
export function RatioBar({
  nameKo,
  ratio,
  virtue,
  index = 0,
  max = 100,
  labelClass = "w-24",
}: {
  nameKo: string;
  ratio: number;
  virtue: VirtueCode;
  index?: number;
  /**
   * 막대 끝까지가 몇 %인지. 목록에서 가장 큰 값을 넘긴다.
   *
   * 100 으로 두면 스물넷으로 갈린 집계에서 1등이 20% 라 막대가 죄다
   * 오분의 일 토막이 되고, 그러면 무엇이 몇 번째인지가 안 읽힌다.
   * 1등을 끝까지 늘려야 길이 차이가 보인다.
   *
   * 늘어난 것은 길이뿐이고 옆의 숫자는 언제나 서버가 준 진짜 비율이다.
   * 전체 중 얼마인지는 위 도넛이 따로 말해준다.
   */
  max?: number;
  /** 이름 칸 너비. 강점 이름은 다섯 자, 덕목 이름은 일곱 자까지 간다 */
  labelClass?: string;
}) {
  const meta = VIRTUE_META[virtue];
  const filled = max > 0 ? Math.min((ratio / max) * 100, 100) : 0;

  return (
    <li className="flex items-center gap-2">
      <span className={`${labelClass} shrink-0 truncate font-display text-sm`}>
        {nameKo}
      </span>

      <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-page">
        <span
          className={`bar-grow block h-full rounded-full ${meta.barClass}`}
          style={{
            width: `${filled}%`,
            animationDelay: `${index * BAR_STAGGER_MS}ms`,
            animationDuration: `${BAR_DURATION_MS}ms`,
          }}
        />
      </span>

      <span className="num w-9 shrink-0 text-right text-sm text-muted">{ratio}%</span>
    </li>
  );
}

/**
 * 덕목 도넛.
 *
 * 여섯 덕목이 100%를 어떻게 나눠 갖는지 한 그림으로 보여준다.
 *
 * 원을 쓰는 이유는 이 값이 부분-전체이기 때문이다. 합이 정확히 100 이고
 * 조각이 여섯이다 — 원 차트가 감당하는 상한(예닐곱) 안이라 조각을 셀 수 있다.
 * 전에 쓰던 가로 막대는 순위를 읽는 데는 좋지만 "다 합쳐서 하나" 라는 것을
 * 말해주지 못했다. 육각 레이더도 여섯이라 모양은 맞지만, 넓이가 축 차례에
 * 따라 달라져 같은 숫자로 다른 그림이 나온다. 여기서는 쓸 수 없다.
 *
 * 이름표는 그림 옆에 목록으로 두지 않고 조각마다 붙인다. 목록으로 두면
 * 색을 보고 목록으로 갔다가 다시 조각으로 돌아오는 왕복이 여섯 번 생긴다.
 *
 * 자리가 없어 접힌 이름표는 조각에 손을 올리면 나온다. 자리 계산은
 * lib/donut.ts 가 한다 (viewBox 단위라 화면 크기와 무관하게 같은 결과).
 *
 * 그림은 읽는 프로그램에서 숨기고, 같은 내용을 아래 숨은 목록이 글자로 갖는다.
 * 손을 올릴 수 없는 기기에서도 이 목록은 읽힌다.
 */
export function VirtueDonut({ rows }: { rows: readonly VirtueRatioRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  const arcs = buildDonut(rows);
  const circumference = 2 * Math.PI * DONUT_R;

  return (
    <div>
      <svg
        viewBox={`0 0 ${DONUT_WIDTH} ${DONUT_HEIGHT}`}
        className="mx-auto block w-full max-w-[360px]"
        aria-hidden
      >
        {arcs.map((arc) => {
          const meta = VIRTUE_META[arc.virtue];
          const { label } = arc;

          return (
            /* 손을 올리는 대상은 이 묶음이다. 칠해진 조각 위에서만 반응한다 */
            <g key={arc.virtue} className="group">
              <circle
                cx={DONUT_CX}
                cy={DONUT_CY}
                r={DONUT_R}
                fill="none"
                stroke={`var(${meta.colorVar})`}
                strokeWidth={DONUT_STROKE}
                /* 조각 하나를 그리고 나머지 둘레는 비운다. 호 좌표를 직접 계산하는
                   것보다 이음매가 깨끗하고, 100%가 한 조각일 때도 그대로 그려진다 */
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                /* 12시에서 시작해 시계 방향으로 */
                transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
              />

              <g
                className={
                  label.hidden
                    ? "opacity-0 transition-opacity group-hover:opacity-100"
                    : undefined
                }
              >
                {/* 접힌 이름표는 이웃 위로 올라오므로 뒤에 판을 깐다 */}
                {label.hidden && (
                  <rect
                    x={label.box.x - 4}
                    y={label.box.y - 2}
                    width={label.box.width + 8}
                    height={label.box.height + 4}
                    rx="4"
                    fill="var(--color-surface)"
                    stroke="var(--color-line)"
                  />
                )}

                <text
                  x={label.x}
                  y={label.y - 2}
                  textAnchor={label.anchor}
                  fill={`var(${meta.colorVar})`}
                  fontSize="12"
                >
                  {meta.nameKo}
                </text>
                <text
                  x={label.x}
                  y={label.y + 12}
                  textAnchor={label.anchor}
                  fill="var(--color-muted)"
                  fontSize="11"
                  className="num"
                >
                  {arc.ratio}%
                </text>
              </g>
            </g>
          );
        })}

        <text
          x={DONUT_CX}
          y={DONUT_CY + 4}
          textAnchor="middle"
          fill="var(--color-muted)"
          fontSize="12"
        >
          덕목
        </text>
      </svg>

      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.virtue}>
            {VIRTUE_META[row.virtue].nameKo} {row.ratio}%
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 덕목 색 범례.
 *
 * 색이 무엇을 뜻하는지 풀어주는 자리다.
 *
 * 소계를 같이 두는 것은 덤이 아니라, 이 한 줄이 "우리가 어느 쪽으로
 * 기울어 있나" 를 먼저 말해주기 때문이다. 그 아래 순위표는 그다음이다.
 *
 * 색 조각은 눈으로만 읽는 것이지만 이 목록을 통째로 숨기지는 않는다.
 * 강점 보기에는 덕목 이름이 여기 말고 없어서, 숨기면 읽는 프로그램에서
 * 덕목이 아예 사라진다. 히트맵에서는 칸 머리글과 조금 겹치지만,
 * 겹쳐 들리는 쪽이 아예 안 들리는 쪽보다 낫다.
 */
export function VirtueLegend({ rows }: { rows: readonly VirtueRatioRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {rows.map((row) => {
        const meta = VIRTUE_META[row.virtue];
        return (
          <li key={row.virtue} className="flex items-center gap-1.5 text-sm">
            <span className={`h-3 w-3 shrink-0 rounded-[2px] ${meta.barClass}`} />
            <span className={meta.textClass}>{meta.nameKo}</span>
            <span className="num text-muted">{row.ratio}%</span>
          </li>
        );
      })}
    </ul>
  );
}
