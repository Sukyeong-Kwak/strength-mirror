/**
 * 앱 전역 상수. 매직 넘버는 전부 여기로 모은다 (8장).
 */

/** 한 번의 제출에서 고를 수 있는 강점 수 */
export const MIN_STRENGTHS_PER_SUBMISSION = 1;
export const MAX_STRENGTHS_PER_SUBMISSION = 5;

/** 사유 최소 길이 */
export const MIN_REASON_LENGTH = 10;

/** 결과 공개 게이트 — 한 사람이 받아야 할 최소 강점 선택 수 (4장) */
export const MIN_STRENGTHS_PER_PERSON = 5;

/** 조가 지정되지 않은 인원을 묶어 부르는 이름 (5-9) */
export const UNASSIGNED_GROUP_LABEL = "미지정";

/**
 * localStorage 키 (5-11). 이 세 개로 통일한다.
 *
 * submitted 는 이미 강점을 남긴 사람의 id 목록이다.
 * 서버에 묻지 않는 이유는, 기기를 식별하려면 그 값을 어차피
 * localStorage 에 둬야 하고 그러면 저장소를 지울 때 같이 사라지기 때문이다.
 * 서버에 제출자 식별값을 남기지 않는 편이 낫다.
 */
export const STORAGE_KEYS = {
  submitted: "via:submitted:v1",
  myGroup: "via:myGroup:v1",
  draftPrefix: "via:draft:",
} as const;

export function draftStorageKey(personId: string): string {
  return `${STORAGE_KEYS.draftPrefix}${personId}`;
}

/** 초안 자동 저장 디바운스 (5-10) */
export const DRAFT_DEBOUNCE_MS = 500;

/** 막대 애니메이션 (6-5) */
export const BAR_STAGGER_MS = 40;
export const BAR_DURATION_MS = 700;

/** 관리자 홈 최근 활동 표시 건수 (5-7) */
export const RECENT_ACTIVITY_LIMIT = 20;

/** 차트 스택 막대에서 라벨을 막대 안에 넣는 최소 구간 폭 (7-3) */
export const STACK_INLINE_LABEL_MIN_RATIO = 4;
