/**
 * 화면용 파생 타입.
 *
 * types/database.ts 는 `supabase gen types` 의 생성물이라 손대지 않는다.
 * DB 응답을 화면에서 쓰기 좋은 형태로 좁힌 타입만 여기에 둔다.
 */

import type { StrengthCode, VirtueCode, VirtueMeta } from "@/lib/strengths";

/** Server Action 반환값은 전부 이 형태로 통일한다 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** 차트 한 행. 건수는 애초에 서버에서 내려오지 않는다 */
export type StrengthRatioRow = {
  strengthCode: StrengthCode;
  nameKo: string;
  virtue: VirtueCode;
  /** 0~100 정수 */
  ratio: number;
};

export type VirtueRatioRow = {
  virtue: VirtueCode;
  /** 0~100 정수 */
  ratio: number;
};

/** 덕목별 보기에서 쓰는 묶음 */
export type VirtueGroup = {
  virtue: VirtueCode;
  meta: VirtueMeta;
  /** 덕목 소계 비율 */
  subtotal: number;
  rows: readonly StrengthRatioRow[];
};

/** 차트 보기 전환 상태. URL 쿼리 ?view= 에 그대로 실린다 */
export const CHART_VIEWS = ["strength", "virtue"] as const;
export type ChartView = (typeof CHART_VIEWS)[number];

export function isChartView(value: unknown): value is ChartView {
  return typeof value === "string" && CHART_VIEWS.some((v) => v === value);
}

/** 결과 공개 게이트 상태. 이름도 개인별 건수도 들어 있지 않다 */
export type ResultsStatus = {
  unlocked: boolean;
  /** 아직 5개를 못 채운 사람 수 */
  remaining: number;
};

/** 목록·카드에서 쓰는 사람 정보. created_by 는 anon 에게 내려오지 않는다 */
export type Person = {
  id: string;
  name: string;
  groupName: string | null;
  createdAt: string;
};

/** 이 기기가 남긴 제출 이력 한 줄 */
export type MySubmission = {
  personId: string;
  strengthCode: StrengthCode;
  createdAt: string;
};

/** 개인 결과 페이지의 사유 카드 */
export type ReasonEntry = {
  personId: string;
  strengthCode: StrengthCode;
  reason: string;
  /** 비어 있으면 익명 */
  authorName: string | null;
  createdAt: string;
};

/** 관리자 수신 현황 한 행 */
export type PersonTotals = {
  personId: string;
  name: string;
  groupName: string;
  createdBy: string | null;
  submissionCount: number;
  strengthCount: number;
};

/** 관리자 조별 합계 한 행 */
export type GroupTotals = {
  groupName: string;
  personCount: number;
  strengthCount: number;
};

/** 제출 폼이 서버로 보내는 항목 */
export type FeedbackItemInput = {
  code: StrengthCode;
  reason: string;
};
