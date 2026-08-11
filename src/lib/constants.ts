/**
 * 앱 전역 상수. 매직 넘버는 전부 여기로 모은다 (8장).
 */

/** 한 번의 제출에서 고를 수 있는 강점 수 */
export const MIN_STRENGTHS_PER_SUBMISSION = 1;
export const MAX_STRENGTHS_PER_SUBMISSION = 5;

/** 사유 최소 길이 */
export const MIN_REASON_LENGTH = 10;

/**
 * 사유 최대 길이. DB 에는 상한이 없고 화면에서만 막는다.
 * 결과 화면의 사유 카드가 읽을 만한 길이를 넘지 않게 하려는 것이다
 */
export const MAX_REASON_LENGTH = 500;

/** 작성자 이름 최대 길이. DB 의 CHECK 과 같은 값이어야 한다 */
export const MAX_AUTHOR_NAME_LENGTH = 20;

/** 결과 공개 게이트 — 한 사람이 받아야 할 최소 강점 선택 수 (4장) */
export const MIN_STRENGTHS_PER_PERSON = 5;

/** 조가 지정되지 않은 인원을 묶어 부르는 이름 (5-9) */
export const UNASSIGNED_GROUP_LABEL = "미지정";

/**
 * localStorage 키 (5-11). 이 목록으로 통일한다.
 *
 * submitted 는 이 기기가 남긴 (사람, 강점) 목록이다.
 * 서버에 묻지 않는 이유는, 기기를 식별하려면 그 값을 어차피
 * localStorage 에 둬야 하고 그러면 저장소를 지울 때 같이 사라지기 때문이다.
 * 서버에 제출자 식별값을 남기지 않는 편이 낫다.
 *
 * authorName 은 직전에 적은 이름이다. 강점을 하나씩 남기는 흐름이라
 * 매번 다시 적게 하면 결국 아무도 이름을 적지 않는다.
 */
export const STORAGE_KEYS = {
  submitted: "via:submitted:v1",
  myGroup: "via:myGroup:v1",
  authorName: "via:authorName:v1",
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

/**
 * 히트맵 판의 종횡비 (가로 ÷ 세로).
 *
 * 트리맵 계산에 그대로 들어간다. 화면 CSS 와 같은 값이어야 칸이 실제로
 * 정사각형에 가깝게 나온다. 한 곳에서만 정하는 이유가 그것이다.
 *
 * 3:2 는 좁은 화면에서도 세로가 너무 길어지지 않고, 넓은 화면에서도
 * 24칸이 납작해지지 않는 선이다.
 */
export const HEATMAP_ASPECT = 3 / 2;

/**
 * 0% 강점 한 칸에 주는 자리.
 *
 * 비율이 5% 눈금이라 24개 중 여럿이 0% 로 내려앉는다. 넓이를 0 으로 두면
 * 그 강점은 판에서 아예 사라지는데, 그러면 "24가지 중 어디에 모였나" 를
 * 보여주는 판이 아니게 된다. 그래서 아주 작은 자리를 남긴다.
 *
 * 1% 보다 작게 잡은 것은 이 자리들이 실제 비율을 밀어내기 때문이다.
 * 열 칸이 0% 여도 전체의 6% 만 가져간다. 칸 안의 퍼센트 숫자는 언제나
 * 서버가 내려준 진짜 값이고, 넓이만 이만큼 눌린다.
 */
export const HEATMAP_EMPTY_WEIGHT = 0.6;

/**
 * 칸 안에 글자를 넣는 최소 넓이 (판 전체를 100 으로 본 넓이).
 *
 * 좁은 화면(360px)에서 판은 대략 328×219px 다. 넓이 3.5 는 약 45×45px 이라
 * 10px 글자 한 줄이 들어가고, 7 은 약 64×64px 이라 퍼센트까지 들어간다.
 */
export const HEATMAP_NAME_MIN_AREA = 3.5;
export const HEATMAP_RATIO_MIN_AREA = 7;
