import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { OverallReportData } from "@/lib/data/reports";
import { groupByVirtue, rankStrengths, splitByVisibility } from "@/lib/ratio";
import { STRENGTHS, VIRTUE_META } from "@/lib/strengths";

import {
  BarRow,
  COLOR,
  DemoNote,
  Footer,
  Heatmap,
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
 * 모두의 강점 리포트.
 *
 * 모임 전체를 한 묶음으로 남긴다. 조끼리 순위를 매기지 않고 조마다의 색만 나란히 둔다.
 * 마지막 장에 사람마다 대표 강점 세 가지를 실어, 모임의 기념 명단처럼 쓸 수 있게 한다.
 */
export function OverallReport({ data }: { data: OverallReportData }) {
  const { mentioned } = splitByVisibility(data.overall);
  // 순위는 사이트와 같은 차례로 (같은 비율이면 VIA 표의 차례)
  const charted = rankStrengths(data.overall);
  const virtues = groupByVirtue(data.overall).map((g) => ({
    virtue: g.virtue,
    ratio: g.subtotal,
  }));
  const max = charted[0]?.ratio ?? 100;

  return (
    <Document title="모두의 강점 리포트" author="강점 발굴" language="ko">
      <Page size="A4" style={s.page}>
        {/* 쪽마다 고정. 본문보다 앞에 둬야 모든 쪽에 그려진다 */}
        <Footer label={`모두의 강점 · ${data.event.title}`} />
        {data.event.isSample && <DemoNote />}
        <Text style={s.brand}>{data.event.title} · {todayLabel()}</Text>
        <Text style={s.title}>모두의 강점</Text>
        <Text style={s.subtitle}>
          하나님께서 우리 한 사람 한 사람에게 주신 강점을 함께 발견했어요.
        </Text>

        {data.overall.length === 0 ? (
          <Section title="아직 모인 강점이 없어요">
            <Text style={s.muted}>강점이 모이면 이 리포트도 채워져요.</Text>
          </Section>
        ) : (
          <>
            {/* 사이트 모두의 강점의 두 보기를 차례로 싣는다 — 히트맵, 그리고 순위 */}
            <Section title="우리에게 주신 강점은?" lead="여섯 덕목으로 본, 우리 모임에 주신 강점이에요.">
              <Heatmap rows={data.overall} />
            </Section>

            <Section title="우리에게 많이 주신 강점">
              <View style={{ marginBottom: 8 }}>
                <VirtueStrip segments={virtues} />
              </View>
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
                  드물게 발견된 강점 · {strengthNames(mentioned.map((r) => r.strengthCode))}
                </Text>
              )}
            </Section>

            {data.profiles.length > 0 && (
              <Section
                title="조마다의 결"
                lead="누가 더 많이가 아니라, 조마다 주신 강점의 색을 나란히 놓았어요."
              >
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
                  {data.profiles.map((profile) => (
                    <View key={profile.groupName} style={{ width: "50%", padding: 4 }} wrap={false}>
                      <View
                        style={[
                          s.card,
                          profile.topVirtue === null
                            ? {}
                            : { borderTopWidth: 3, borderTopColor: VIRTUE_COLOR[profile.topVirtue] },
                        ]}
                      >
                        <Text style={s.name}>{profile.groupName}</Text>
                        {profile.topVirtue !== null && (
                          <Text style={{ fontSize: 9, color: VIRTUE_INK[profile.topVirtue] }}>
                            {VIRTUE_META[profile.topVirtue].nameKo} 쪽이 {profile.topVirtueRatio}%
                          </Text>
                        )}
                        <Text style={[s.small, { marginTop: 3 }]}>
                          <Text style={s.muted}>많이 주신 강점 · </Text>
                          {strengthNames(profile.top)}
                        </Text>
                        {profile.distinctive !== null && (
                          <Text style={s.small}>
                            <Text style={s.muted}>이 조에서 유독 · </Text>
                            {strengthName(profile.distinctive)}
                          </Text>
                        )}
                        <Text style={[s.small, s.muted]}>
                          {STRENGTHS.length}가지 중 {profile.covered}가지를 함께 채웠어요
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Section>
            )}

            <Section
              title="아직 숨은 강점"
              lead="우리 안에 주셨지만 아직 잘 발견되지 않은 강점이에요. 다음엔 이런 모습도 찾아보면 어떨까요."
            >
              {data.hidden.untouched.length === 0 && data.hidden.rare.length === 0 ? (
                <Text style={s.muted}>스물네 가지가 모두 고르게 나왔어요. 숨은 강점이 없어요.</Text>
              ) : (
                <>
                  {data.hidden.untouched.length > 0 && (
                    <Text>
                      <Text style={s.muted}>아직 아무도 발견하지 않았어요 · </Text>
                      {data.hidden.untouched.map((x) => x.nameKo).join(", ")}
                    </Text>
                  )}
                  {data.hidden.rare.length > 0 && (
                    <Text>
                      <Text style={s.muted}>드물게 발견됐어요 · </Text>
                      {data.hidden.rare.map((x) => x.nameKo).join(", ")}
                    </Text>
                  )}
                </>
              )}
            </Section>

            {data.groupDetails.length > 0 && (
              <View style={s.section}>
                {data.groupDetails.map((group, index) => {
                  const split = splitByVisibility(group.rows);
                  const ranked = rankStrengths(group.rows);
                  const groupMax = ranked[0]?.ratio ?? 100;
                  return (
                    // 조 하나는 한 쪽 안에 둔다. 머리와 막대가 다른 쪽으로 갈라지면 읽기 어렵다
                    <View key={group.groupName} style={{ marginBottom: 14 }} wrap={false}>
                      {/* 섹션 제목은 첫 조와 한 덩어리로 둔다. 따로 두면 쪽 끝에 제목만 남는다 */}
                      {index === 0 && (
                        <View>
                          <Text style={s.h2}>조별로 자세히</Text>
                          <Text style={s.lead}>조마다 발견한 강점 전체예요.</Text>
                        </View>
                      )}
                      <View>
                        <Text style={[s.h2, { fontSize: 13, marginBottom: 4 }]}>
                          {group.groupName}
                        </Text>
                        {/* 조별 보기의 히트맵. 한 쪽에 조 하나가 들어가게 납작하게 그린다 */}
                        <View style={{ marginBottom: 8 }}>
                          <Heatmap rows={group.rows} aspect={2.4} />
                        </View>
                      </View>
                      <View style={{ marginTop: 6 }}>
                        {ranked.map((row) => (
                          <BarRow
                            key={row.strengthCode}
                            label={strengthName(row.strengthCode)}
                            ratio={row.ratio}
                            max={groupMax}
                            color={VIRTUE_COLOR[row.virtue]}
                          />
                        ))}
                      </View>
                      {split.mentioned.length > 0 && (
                        <Text style={[s.small, s.muted]}>
                          드물게 발견된 강점 · {strengthNames(split.mentioned.map((r) => r.strengthCode))}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {data.people.length > 0 && (
          <Section
            title="한 사람 한 사람"
            lead="한 사람 한 사람에게 주신 강점이에요."
            breakBefore
          >
            {data.people.map((person, index) => {
              const newGroup = data.people[index - 1]?.groupLabel !== person.groupLabel;
              return (
                <View key={`${person.groupLabel}-${person.name}-${index}`}>
                  {newGroup && (
                    <View minPresenceAhead={30}>
                      <Text style={[s.h2, { fontSize: 13, marginTop: index === 0 ? 0 : 10 }]}>
                        {person.groupLabel}
                      </Text>
                    </View>
                  )}
                  <View
                    wrap={false}
                    style={{
                      flexDirection: "row",
                      paddingVertical: 3,
                      borderBottomWidth: 1,
                      borderBottomColor: COLOR.track,
                    }}
                  >
                    <Text style={[s.name, { width: 90 }]}>{person.name}</Text>
                    <Text style={{ flex: 1, color: person.top.length === 0 ? COLOR.muted : COLOR.ink }}>
                      {person.top.length === 0 ? "아직 발견한 강점이 없어요" : strengthNames(person.top)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Section>
        )}

      </Page>
    </Document>
  );
}
