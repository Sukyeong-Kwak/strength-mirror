/**
 * 화면용 파생 타입.
 *
 * types/database.ts 는 `supabase gen types` 의 생성물이라 손대지 않는다.
 * DB 응답을 화면에서 쓰기 좋은 형태로 좁힌 타입만 여기에 둔다.
 */

import type { Database } from "@/types/database";

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

/**
 * 차트 보기 전환 상태. URL 쿼리 ?view= 에 그대로 실린다.
 *
 * 차례가 곧 탭 차례다. 히트맵이 앞인 이유는 전체 집계에서 먼저 보여야 할 것이
 * 순위표가 아니라 "우리가 어느 쪽으로 기울어 있나" 이기 때문이다.
 *
 * 전에는 덕목 보기가 따로 있었다. 순위 쪽 머리에 덕목 도넛을 얹으면서
 * 그 탭이 하던 말을 도넛이 다 하게 되어 없앴다. 같은 것을 두 자리에서
 * 보여주면 사람은 둘이 다른 것인 줄 알고 둘 다 열어본다.
 */
export const CHART_VIEWS = ["heatmap", "ranking"] as const;
export type ChartView = (typeof CHART_VIEWS)[number];

export function isChartView(value: unknown): value is ChartView {
  return typeof value === "string" && CHART_VIEWS.some((v) => v === value);
}

/**
 * 쿼리로 들어온 보기를 그 화면이 가진 탭으로 좁힌다.
 *
 * 없는 값이나 그 화면에 없는 탭이 오면 첫 탭으로 되돌린다. 주소를 손으로
 * 고쳐 넣었을 때 빈 화면이 나오지 않게 하려는 것이고, 첫 탭이 곧 기본값이라
 * 화면마다 기본값을 따로 적지 않아도 된다.
 */
export function pickChartView(
  raw: unknown,
  allowed: readonly ChartView[] = CHART_VIEWS,
): ChartView {
  const fallback = allowed[0] ?? CHART_VIEWS[0];
  return isChartView(raw) && allowed.includes(raw) ? raw : fallback;
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
  /**
   * 숨긴 사람인지.
   * 숨기면 목록·집계·결과 공개 게이트에서 빠지지만 받은 글은 남는다.
   */
  hidden: boolean;
};

/** 관리자 조별 합계 한 행 */
export type GroupTotals = {
  groupName: string;
  personCount: number;
  strengthCount: number;
};

/**
 * 관리자 활동 기록의 동작.
 * DB 쪽은 CHECK 제약이라 생성 타입이 string 으로 나온다. 여기서 좁혀 쓴다.
 */
export const ADMIN_ACTIONS = [
  "login",
  "import_people",
  "exclude_feedback",
  "restore_feedback",
  "add_admin",
  "remove_admin",
  "hide_person",
  "restore_person",
  "delete_person",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export function isAdminAction(value: unknown): value is AdminAction {
  return typeof value === "string" && ADMIN_ACTIONS.some((a) => a === value);
}

/** 활동 기록의 detail 은 jsonb 라 무엇이든 올 수 있다 */
export type AdminActivityDetail =
  Database["public"]["Tables"]["admin_audit_log"]["Row"]["detail"];

/** 관리자 활동 기록 한 줄 */
export type AdminActivity = {
  id: number;
  adminEmail: string;
  action: AdminAction;
  detail: AdminActivityDetail;
  createdAt: string;
};

/** 허용목록 한 줄 */
export type AdminEntry = {
  email: string;
  label: string | null;
  addedBy: string | null;
  /**
   * 서버에서 만든 상대 시간.
   * 클라이언트에서 계산하면 서버 렌더 결과와 어긋나 하이드레이션이 깨진다.
   */
  addedAtLabel: string;
};

/** 제출 폼이 서버로 보내는 항목 */
export type FeedbackItemInput = {
  code: StrengthCode;
  reason: string;
};
