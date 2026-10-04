import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { PersonReportData, ReportMatch } from "@/lib/data/reports";
import { groupByVirtue, splitByVisibility } from "@/lib/ratio";
import { VIRTUE_META, getStrength, type StrengthCode } from "@/lib/strengths";
import { alsoCalledLine, confusables, distinctionTitle } from "@/lib/strengthText";

import {
  BarRow,
  COLOR,
  DemoNote,
  Footer,
  Section,
  VIRTUE_COLOR,
  VIRTUE_INK,
  VirtueStrip,
  s,
  strengthName,
  strengthNames,
  todayLabel,
} from "./parts";

/**
 * 한 사람의 강점 리포트.
 *
 * 화면의 결과를 간직할 수 있게 옮긴 것이다. 첫 장만 떼어 봐도 무엇인지 알 수 있게
 * 이름 · 대표 강점 · 유독 보인 강점을 앞에 모으고, 남겨준 이야기는 전부 뒤에 싣는다.
 */
export function PersonReport({ data }: { data: PersonReportData }) {
  const subject = `${data.name}님`;
  const { charted, mentioned } = splitByVisibility(data.rows);
  const virtues = groupByVirtue(data.rows).map((g) => ({ virtue: g.virtue, ratio: g.subtotal }));
  const max = charted[0]?.ratio ?? 100;

  // 이야기는 강점별로 모은다. 강점 차례는 많이 받은 순
  const order = new Map(data.rows.map((row, i) => [row.strengthCode, i]));
  const storyGroups = [...new Set(data.reasons.map((r) => r.strengthCode))]
    .sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
    .map((code) => ({
      code,
      reasons: data.reasons.filter((r) => r.strengthCode === code),
    }));

  return (
    <Document title={`${data.name} 강점 리포트`} author="강점 발굴" language="ko">
      <Page size="A4" style={s.page}>
        {/* 쪽마다 고정. 본문보다 앞에 둬야 모든 쪽에 그려진다 */}
        <Footer label={`${data.name} · 강점 발굴`} />
        {data.mode === "demo" && <DemoNote />}
        <Text style={s.brand}>강점 발굴 · {todayLabel()}</Text>
        <Text style={s.title}>{subject}의 강점</Text>
        <Text style={s.subtitle}>
          {data.groupLabel} · 곁에 있는 사람들이 {subject}에게서 본 것들
        </Text>

        {data.rows.length === 0 ? (
          <Section title="아직 남겨진 강점이 없어요">
            <Text style={s.muted}>강점이 모이면 이 리포트도 채워져요.</Text>
          </Section>
        ) : (
          <>
            <Section title="가장 많이 보인 강점">
              <View style={{ flexDirection: "column" }}>
                {data.top.map((item) => {
                  const strength = getStrength(item.code);
                  return (
                    <View
                      key={item.code}
                      wrap={false}
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: VIRTUE_COLOR[strength.virtue],
                        paddingLeft: 10,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text
                          style={{ fontFamily: "DoHyeon", fontSize: 18, lineHeight: 1.2, paddingBottom: 4 }}
                        >
                          {strength.nameKo}
                        </Text>
                        {item.ratio > 0 && (
                          <Text style={{ color: COLOR.muted }}>{item.ratio}%</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 9, color: VIRTUE_INK[strength.virtue] }}>
                        {VIRTUE_META[strength.virtue].nameKo}
                      </Text>
                      <Text style={{ fontSize: 9.5, color: COLOR.muted, marginTop: 2 }}>
                        {strength.short}
                      </Text>
                      {item.quote !== null && (
                        <Text style={{ marginTop: 4 }}>“{item.quote}”</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Section>

            {data.distinctive.length > 0 && (
              <Section
                title="유독 많이 보인 강점"
                lead={`많이 받은 순이 아니라, 모두가 받은 것과 견줘 ${subject}에게서 특히 더 보인 강점이에요.`}
              >
                {data.distinctive.map((d) => {
                  const strength = getStrength(d.code);
                  return (
                    <View key={d.code} style={{ marginBottom: 8 }} wrap={false}>
                      <Text style={s.name}>{strength.nameKo}</Text>
                      <BarRow
                        label={subject}
                        ratio={d.mine}
                        color={VIRTUE_COLOR[strength.virtue]}
                      />
                      <BarRow label="모두" ratio={d.everyone} color="#b8bec8" />
                    </View>
                  );
                })}
              </Section>
            )}

            <Section title="덕목으로 보면" lead="여섯 덕목 중 어느 쪽에 강점이 모였는지예요.">
              <VirtueStrip segments={virtues} />
            </Section>

            <Section title="받은 강점 전체">
              {charted.map((row) => (
                <BarRow
                  key={row.strengthCode}
                  label={strengthName(row.strengthCode)}
                  ratio={row.ratio}
                  max={max}
                  color={VIRTUE_COLOR[row.virtue]}
                />
              ))}
              {mentioned.length > 0 && (
                <Text style={[s.small, s.muted, { marginTop: 4 }]}>
                  이런 강점도 받았어요 · {strengthNames(mentioned.map((r) => r.strengthCode))}
                </Text>
              )}
            </Section>

            {/*
              강점 풀이는 사이트의 강점 설명(StrengthBody)과 같은 순서 · 같은 문구로 싣는다.
              문구는 모두 lib/strengths.ts 와 lib/strengthText.ts 에서 온다. 여기서 새로 쓰지 않는다
            */}
            <Section
              title="가장 많이 보인 강점, 더 자세히"
              lead="사이트의 '24가지 강점' 설명과 같은 내용이에요."
            >
              {data.top.map((item) => (
                <StrengthExplain key={item.code} code={item.code} />
              ))}
            </Section>

            {data.similar.length + data.complement.length > 0 && (
              <Section title="결이 비슷한 사람 · 서로 채워주는 사람">
                <MatchBlock
                  title="결이 비슷한 사람"
                  lead="받은 강점의 모양이 닮았어요."
                  label="함께 많이 받은 강점"
                  entries={data.similar}
                />
                <MatchBlock
                  title="서로 채워주는 사람"
                  lead={`${subject}이 아직 받지 않은 강점이 많이 보인 사람이에요. 퍼즐의 옆 조각처럼요.`}
                  label="이분에게서 많이 보인 강점"
                  entries={data.complement}
                />
              </Section>
            )}
          </>
        )}

        {storyGroups.length > 0 && (
          <Section
            title="남겨준 이야기"
            lead="남긴 사람은 모두 익명이에요."
          >
            {storyGroups.map((group) => (
              <StoryGroup key={group.code} code={group.code} reasons={group.reasons} />
            ))}
          </Section>
        )}

      </Page>
    </Document>
  );
}

function MatchBlock({
  title,
  lead,
  label,
  entries,
}: {
  title: string;
  lead: string;
  label: string;
  entries: readonly ReportMatch[];
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <View style={{ marginBottom: 10 }} wrap={false}>
      <Text style={{ fontWeight: 700 }}>{title}</Text>
      <Text style={[s.small, s.muted, { marginBottom: 4 }]}>{lead}</Text>
      {entries.map((entry) => (
        <View key={`${entry.name}-${entry.groupLabel}`} style={{ marginBottom: 3 }}>
          <Text>
            <Text style={s.name}>{entry.name}</Text>
            <Text style={s.muted}>  {entry.groupLabel}</Text>
          </Text>
          <Text style={[s.small, s.muted]}>
            {label} · {strengthNames(entry.strengths)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StoryGroup({
  code,
  reasons,
}: {
  code: StrengthCode;
  reasons: PersonReportData["reasons"];
}) {
  const strength = getStrength(code);
  return (
    <View style={{ marginBottom: 10 }}>
      {reasons.map((entry, index) => (
        <View
          key={`${entry.createdAt}-${index}`}
          wrap={false}
          style={{
            borderBottomWidth: index === reasons.length - 1 ? 0 : 1,
            borderBottomColor: COLOR.track,
            paddingVertical: 4,
          }}
        >
          {/* 강점 이름은 첫 이야기와 한 덩어리로. 따로 두면 쪽 끝에 이름만 남는다 */}
          {index === 0 && (
            <Text style={[s.name, { color: VIRTUE_INK[strength.virtue] }]}>
              {strength.nameKo}
            </Text>
          )}
          <Text>{entry.reason}</Text>
        </View>
      ))}
    </View>
  );
}

/** 사이트의 강점 설명(StrengthBody)을 종이에 옮긴 것. 칸의 차례와 머리말이 같다 */
function StrengthExplain({ code }: { code: StrengthCode }) {
  const strength = getStrength(code);
  const meta = VIRTUE_META[strength.virtue];
  const alsoCalled = alsoCalledLine(strength);
  const others = confusables(strength);
  const label = [s.small, s.muted, { marginTop: 6 }];

  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={[s.name, { fontSize: 15, color: VIRTUE_INK[strength.virtue] }]}>
        {strength.nameKo}
      </Text>
      <Text style={[s.small, { color: VIRTUE_INK[strength.virtue] }]}>{meta.nameKo}</Text>
      <Text style={[s.small, s.muted]}>영문 이름 {strength.nameEn}</Text>
      {alsoCalled !== null && <Text style={[s.small, s.muted]}>{alsoCalled}</Text>}

      <Text style={{ marginTop: 4 }}>{strength.long}</Text>

      <View style={{ marginTop: 6, backgroundColor: COLOR.page, borderRadius: 4, padding: 6 }}>
        <Text style={[s.small, s.muted]}>VIA 분류에서는</Text>
        <Text>{strength.viaDefinition}</Text>
      </View>

      <Text style={label}>이런 모습이 보이면</Text>
      {strength.examples.map((example) => (
        <Text key={example} style={{ paddingLeft: 8 }}>
          · {example}
        </Text>
      ))}

      <Text style={label}>{distinctionTitle(strength)}</Text>
      <Text>{strength.distinction}</Text>
      {others.map((other) => (
        <Text key={other.code} style={[s.small, { paddingLeft: 8 }]}>
          · {other.nameKo} <Text style={s.muted}>· {other.short}</Text>
        </Text>
      ))}
    </View>
  );
}
