/**
 * PDF 리포트에 들어갈 재료.
 *
 * 화면과 같은 공개 뷰, 같은 계산(lib/insights)을 쓴다. 파일이라고 더 드러내는 것은 없다.
 * 건수는 여기서도 만들지 않고, 남긴 사람은 여기서도 익명이다.
 */

import { getAppMode, type AppMode } from "@/lib/data/appState";
import { getPerson, listPeople } from "@/lib/data/people";
import {
  getAllGroupStrengthRatios,
  getAllPersonStrengthRatios,
  getOverallStrengthRatio,
  getPersonReasons,
} from "@/lib/data/results";
import { UNASSIGNED_GROUP_LABEL } from "@/lib/constants";
import { collectGroupNames, toGroupLabel } from "@/lib/groups";
import {
  complementPeople,
  distinctiveStrengths,
  groupProfiles,
  hiddenStrengths,
  pickQuote,
  similarPeople,
  topStrengths,
  type Distinctive,
  type GroupProfile,
  type HiddenStrengths,
} from "@/lib/insights";
import type { StrengthCode } from "@/lib/strengths";
import type { ReasonEntry, StrengthRatioRow } from "@/types/domain";

export type ReportMatch = { name: string; groupLabel: string; strengths: StrengthCode[] };

export type PersonReportData = {
  mode: AppMode;
  name: string;
  groupLabel: string;
  rows: StrengthRatioRow[];
  top: Array<{ code: StrengthCode; ratio: number; quote: string | null }>;
  distinctive: Distinctive[];
  similar: ReportMatch[];
  complement: ReportMatch[];
  reasons: ReasonEntry[];
};

/** 한 사람의 리포트. 없거나 지금 화면에 없는 사람이면 null */
export async function getPersonReportData(personId: string): Promise<PersonReportData | null> {
  const person = await getPerson(personId);
  if (person === null) {
    return null;
  }

  const [allRatios, overall, reasons, people, mode] = await Promise.all([
    getAllPersonStrengthRatios(),
    getOverallStrengthRatio(),
    getPersonReasons(person.id),
    listPeople(),
    getAppMode(),
  ]);
  const rows = allRatios.get(person.id) ?? [];

  const byId = new Map(people.map((p) => [p.id, p]));
  const toMatch = (id: string, strengths: StrengthCode[]): ReportMatch[] => {
    const found = byId.get(id);
    return found === undefined
      ? []
      : [{ name: found.name, groupLabel: toGroupLabel(found.groupName), strengths }];
  };
  const similarRaw = similarPeople(person.id, allRatios, 2);

  return {
    mode,
    name: person.name,
    groupLabel: toGroupLabel(person.groupName),
    rows,
    top: topStrengths(rows, 3).map((row) => ({
      code: row.strengthCode,
      ratio: row.ratio,
      quote: pickQuote(reasons, row.strengthCode),
    })),
    distinctive: distinctiveStrengths(rows, overall, 3),
    similar: similarRaw.flatMap((s) => toMatch(s.personId, s.shared)),
    complement: complementPeople(
      person.id,
      allRatios,
      new Set(similarRaw.map((s) => s.personId)),
      2,
    ).flatMap((c) => toMatch(c.personId, c.brings)),
    reasons,
  };
}

export type OverallReportData = {
  mode: AppMode;
  peopleCount: number;
  /** 받은 강점이 하나라도 있는 사람 수 */
  receivedCount: number;
  overall: StrengthRatioRow[];
  profiles: GroupProfile[];
  /** 조마다 받은 강점 비율 — 화면의 조별 보기 */
  groupDetails: Array<{ groupName: string; rows: StrengthRatioRow[] }>;
  hidden: HiddenStrengths;
  /** 사람마다 가장 많이 받은 강점. 조 차례 → 이름 차례 */
  people: Array<{ name: string; groupLabel: string; top: StrengthCode[] }>;
};

export async function getOverallReportData(): Promise<OverallReportData> {
  const [people, overall, byGroup, allRatios, mode] = await Promise.all([
    listPeople(),
    getOverallStrengthRatio(),
    getAllGroupStrengthRatios(),
    getAllPersonStrengthRatios(),
    getAppMode(),
  ]);

  // 조별 뷰는 미지정(null)을 묶지 않는다 (results 화면과 같은 규칙)
  const groups = collectGroupNames(people).filter((g) => g !== UNASSIGNED_GROUP_LABEL);

  return {
    mode,
    peopleCount: people.length,
    receivedCount: people.filter((p) => (allRatios.get(p.id) ?? []).length > 0).length,
    overall,
    profiles: groupProfiles(
      new Map(groups.map((g) => [g, byGroup.get(g) ?? []])),
      overall,
    ),
    groupDetails: groups
      .map((g) => ({ groupName: g, rows: byGroup.get(g) ?? [] }))
      .filter((g) => g.rows.length > 0),
    hidden: hiddenStrengths(overall),
    people: collectGroupNames(people).flatMap((group) =>
      people
        .filter((p) => toGroupLabel(p.groupName) === group)
        .map((p) => ({
          name: p.name,
          groupLabel: group,
          top: topStrengths(allRatios.get(p.id) ?? [], 3).map((row) => row.strengthCode),
        })),
    ),
  };
}
