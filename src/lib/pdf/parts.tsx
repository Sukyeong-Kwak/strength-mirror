import path from "node:path";

import { Font, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  HEATMAP_ASPECT,
  HEATMAP_NAME_MIN_AREA,
  HEATMAP_RATIO_MIN_AREA,
} from "@/lib/constants";
import { buildHeatmap, tintPercent } from "@/lib/heatmap";
import { VIRTUE_META, getStrength, type StrengthCode, type VirtueCode } from "@/lib/strengths";
import type { StrengthRatioRow } from "@/types/domain";

/**
 * PDF 공통 부품 — 서체, 색, 막대, 섹션.
 *
 * 화면과 같은 얼굴이 되게 한다. 제목과 이름은 도현체, 본문은 Pretendard.
 * CSS 변수는 PDF 에서 읽을 수 없으므로 globals.css 의 색을 여기 한 번 더 적는다.
 * 팔레트를 바꾸면 두 곳을 함께 고쳐야 한다.
 */

const FONT_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

let registered = false;

/** 서체 등록은 프로세스마다 한 번이면 된다 */
export function registerFonts(): void {
  if (registered) {
    return;
  }
  Font.register({
    family: "Pretendard",
    fonts: [
      { src: path.join(FONT_DIR, "Pretendard-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Pretendard-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "DoHyeon",
    src: path.join(FONT_DIR, "DoHyeon-Regular.ttf"),
  });
  // 한국어는 낱말 중간에 하이픈을 넣어 끊으면 안 된다. 띄어쓰기에서만 줄을 바꾼다
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const COLOR = {
  ink: "#101114",
  muted: "#565e6b",
  line: "#d7dbe2",
  page: "#f6f7f9",
  track: "#eceef2",
} as const;

/** 막대 색 (globals.css --color-virtue-*) */
export const VIRTUE_COLOR: Record<VirtueCode, string> = {
  wisdom: "#2457fc",
  courage: "#cf1001",
  humanity: "#f72fa7",
  justice: "#9e3bed",
  temperance: "#00af50",
  transcendence: "#9e7108",
};

/** 글자 색 (globals.css --color-virtue-*-ink) */
export const VIRTUE_INK: Record<VirtueCode, string> = {
  wisdom: "#2457fc",
  courage: "#cf1001",
  humanity: "#d2058a",
  justice: "#972efe",
  temperance: "#028039",
  transcendence: "#96650a",
};

export const s = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    fontSize: 10,
    color: COLOR.ink,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    lineHeight: 1.5,
  },
  brand: { fontSize: 9, color: COLOR.muted },
  // 도현체는 글자가 줄 상자보다 아래로 내려와 그려진다. 아래 여백으로 다음 줄과 겹치지 않게 한다
  title: { fontFamily: "DoHyeon", fontSize: 28, lineHeight: 1.2, marginTop: 6, paddingBottom: 10 },
  subtitle: { fontSize: 10, color: COLOR.muted },
  section: { marginTop: 22 },
  h2: { fontFamily: "DoHyeon", fontSize: 16, lineHeight: 1.2, paddingBottom: 5 },
  lead: { fontSize: 9, color: COLOR.muted, marginBottom: 8 },
  name: { fontFamily: "DoHyeon", fontSize: 13, lineHeight: 1.2, paddingBottom: 3 },
  muted: { color: COLOR.muted },
  small: { fontSize: 8.5 },
  card: {
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 6,
    padding: 10,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    fontSize: 8,
    color: COLOR.muted,
  },
});

/** 오늘 날짜. 서버 시간대와 상관없이 한국 날짜로 적는다 */
export function todayLabel(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

/**
 * 쪽마다 같은 자리에 리포트 이름을 적는다.
 *
 * 쪽 번호는 넣지 않는다. 쪽 번호를 그리는 render 함수가 Next 의 서버 환경
 * (route handler)에서는 그려지지 않는다. 순수 Node 에서는 되므로 라이브러리와
 * 서버 React 사이의 문제로 보인다. 고쳐지면 render 로 "1 / 3" 을 더한다.
 */
export function Footer({ label }: { label: string }) {
  return (
    <Text style={s.footer} fixed>
      {label}
    </Text>
  );
}

/** 예시 데이터로 만든 파일이면 맨 위에 적는다. 실제 결과로 착각하지 않게 */
export function DemoNote() {
  return (
    <View
      style={{
        marginBottom: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#fff7ed",
        borderRadius: 4,
      }}
    >
      <Text style={{ fontSize: 8.5, color: "#9a3412" }}>
        예시 데이터로 만든 리포트예요. 실제 참여 결과가 아니에요.
      </Text>
    </View>
  );
}

export function Section({
  title,
  lead,
  children,
  breakBefore = false,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
  breakBefore?: boolean;
}) {
  return (
    <View style={s.section} break={breakBefore}>
      {/* 제목만 페이지 끝에 홀로 남지 않게 다음 내용과 붙여 둔다 */}
      <View minPresenceAhead={120}>
        <Text style={s.h2}>{title}</Text>
        {lead !== undefined && <Text style={s.lead}>{lead}</Text>}
      </View>
      {children}
    </View>
  );
}

/** 이름 · 막대 · 비율 한 줄 */
export function BarRow({
  label,
  ratio,
  color,
  max = 100,
  labelWidth = 70,
  valueLabel,
}: {
  label: string;
  ratio: number;
  color: string;
  /** 막대를 이 값에 꽉 차게 그린다. 순위표는 가장 큰 값에 맞춘다 */
  max?: number;
  labelWidth?: number;
  valueLabel?: string;
}) {
  const width = max <= 0 ? 0 : Math.max(0, Math.min(100, (100 * ratio) / max));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }} wrap={false}>
      <Text style={{ width: labelWidth, fontSize: 9.5 }}>{label}</Text>
      <View style={{ flex: 1, height: 7, backgroundColor: COLOR.track, borderRadius: 4 }}>
        <View
          style={{ width: `${width}%`, height: 7, backgroundColor: color, borderRadius: 4 }}
        />
      </View>
      <Text style={{ width: 34, textAlign: "right", fontSize: 9, color: COLOR.muted }}>
        {valueLabel ?? `${ratio}%`}
      </Text>
    </View>
  );
}

/** 덕목 비율을 한 줄 띠로 */
export function VirtueStrip({
  segments,
}: {
  segments: ReadonlyArray<{ virtue: VirtueCode; ratio: number }>;
}) {
  const visible = segments.filter((seg) => seg.ratio > 0);
  return (
    <View>
      <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden" }}>
        {visible.map((seg) => (
          <View
            key={seg.virtue}
            style={{ width: `${seg.ratio}%`, backgroundColor: VIRTUE_COLOR[seg.virtue] }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 5 }}>
        {visible.map((seg) => (
          <Text
            key={seg.virtue}
            style={{ fontSize: 8.5, color: VIRTUE_INK[seg.virtue], marginRight: 10 }}
          >
            {VIRTUE_META[seg.virtue].nameKo} {seg.ratio}%
          </Text>
        ))}
      </View>
    </View>
  );
}

export function strengthName(code: StrengthCode): string {
  return getStrength(code).nameKo;
}

export function strengthNames(codes: readonly StrengthCode[]): string {
  return codes.map(strengthName).join(", ");
}

/** 덕목 색을 흰색과 섞는다 (sRGB). 화면의 color-mix(in srgb, …) 와 같은 계산이다 */
function mixWithWhite(hex: string, percent: number): string {
  const p = percent / 100;
  const channel = (i: number) => {
    const c = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c * p + 255 * (1 - p))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/** A4 본문 폭 (595pt − 좌우 여백 44pt × 2) */
const CONTENT_WIDTH = 507;

/**
 * 히트맵 — 사이트의 히트맵(StrengthHeatmap)을 종이에 옮긴 것.
 *
 * 칸을 나누는 계산(buildHeatmap)과 색 진하기(tintPercent), 글자를 넣는 기준은
 * 화면과 같은 것을 쓴다. 그리는 방법만 다르다.
 */
export function Heatmap({
  rows,
  aspect = HEATMAP_ASPECT,
}: {
  rows: readonly StrengthRatioRow[];
  /** 가로 ÷ 세로. 조별 판은 더 납작하게 그려 한 쪽에 들어가게 한다 */
  aspect?: number;
}) {
  const blocks = buildHeatmap(rows, aspect);
  const maxRatio = Math.max(0, ...blocks.flatMap((b) => b.tiles.map((t) => t.ratio)));
  const width = CONTENT_WIDTH;
  const height = width / aspect;
  // 화면과 같은 기준으로 글자를 넣되, 판 크기가 달라지면 넓이 기준도 그만큼 옮긴다
  const scale = HEATMAP_ASPECT / aspect;

  return (
    <View>
      <Text style={[s.small, s.muted, { marginBottom: 6 }]}>
        칸 크기가 비율이에요. 색은 덕목이고, 스물네 칸을 합치면 100%예요.
      </Text>
      <View
        style={{
          position: "relative",
          width,
          height,
          backgroundColor: COLOR.page,
          borderRadius: 6,
        }}
      >
        {blocks.map((block) => {
          const bx = (block.rect.x / 100) * width;
          const by = (block.rect.y / 100) * height;
          const bw = (block.rect.w / 100) * width;
          const bh = (block.rect.h / 100) * height;
          return (
            <View
              key={block.virtue}
              style={{ position: "absolute", left: bx, top: by, width: bw, height: bh, padding: 2 }}
            >
              <View style={{ position: "relative", width: "100%", height: "100%" }}>
                {block.tiles.map((tile) => {
                  const area = tile.area * scale;
                  const showName = area >= HEATMAP_NAME_MIN_AREA;
                  const showRatio = area >= HEATMAP_RATIO_MIN_AREA;
                  const fill = tile.received
                    ? {
                        backgroundColor: mixWithWhite(
                          VIRTUE_COLOR[tile.virtue],
                          tintPercent(tile.ratio, maxRatio),
                        ),
                      }
                    : { backgroundColor: "#ffffff", borderWidth: 0.5, borderColor: COLOR.line };
                  return (
                    <View
                      key={tile.strengthCode}
                      style={{
                        position: "absolute",
                        left: `${tile.rect.x}%`,
                        top: `${tile.rect.y}%`,
                        width: `${tile.rect.w}%`,
                        height: `${tile.rect.h}%`,
                        padding: 0.75,
                      }}
                    >
                      <View
                        style={{
                          ...fill,
                          width: "100%",
                          height: "100%",
                          borderRadius: 2,
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {showName && (
                          <Text style={{ fontSize: 7, lineHeight: 1.2, textAlign: "center" }}>
                            {tile.nameKo}
                          </Text>
                        )}
                        {showRatio && (
                          <Text style={{ fontSize: 6.5, lineHeight: 1.2 }}>{tile.ratio}%</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 6 }}>
        <VirtueLegend
          segments={blocks
            .filter((b) => b.subtotal > 0)
            .map((b) => ({ virtue: b.virtue, ratio: b.subtotal }))}
        />
      </View>
      <Text style={[s.small, s.muted, { marginTop: 4 }]}>
        작은 칸도 자리를 남기느라 실제 비율보다 조금 크게 그렸어요.
      </Text>
    </View>
  );
}

/** 덕목 이름과 비율만 한 줄로 */
function VirtueLegend({
  segments,
}: {
  segments: ReadonlyArray<{ virtue: VirtueCode; ratio: number }>;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {segments.map((seg) => (
        <Text
          key={seg.virtue}
          style={{ fontSize: 8.5, color: VIRTUE_INK[seg.virtue], marginRight: 10 }}
        >
          {VIRTUE_META[seg.virtue].nameKo} {seg.ratio}%
        </Text>
      ))}
    </View>
  );
}
