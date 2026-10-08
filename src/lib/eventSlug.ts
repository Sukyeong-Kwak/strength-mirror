/**
 * 그룹 주소(slug) 규칙.
 *
 * 그룹마다 참여 주소가 `/e/<slug>` 로 따로 있다. 관리자가 그룹을 만들 때 직접 정한다.
 * 주소창에 그대로 들어가므로 소문자 영문 · 숫자 · 하이픈만 받는다.
 * DB 의 check 제약(events.slug)과 같은 규칙이어야 한다.
 */

export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 40;

/** 하이픈은 사이에만. 앞뒤나 두 번 연달아 오면 주소가 보기 흉하고 헷갈린다 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return (
    value.length >= SLUG_MIN_LENGTH &&
    value.length <= SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(value)
  );
}

/**
 * 치는 중인 글을 주소에 쓸 수 있는 글자로만 남긴다.
 * 대문자는 소문자로, 공백과 밑줄은 하이픈으로 바꾼다. 그 밖의 글자는 지운다.
 * 한글은 지워진다 — 주소에 한글이 들어가면 메신저에서 % 범벅으로 보인다.
 *
 * 끝의 하이픈은 남긴다. 'leader-mt' 를 치는 중에는 'leader-' 를 거쳐야 한다.
 */
export function cleanSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX_LENGTH);
}

/** 다 친 글을 주소 모양으로 다듬는다. 앞뒤 하이픈까지 걷어낸다 */
export function normalizeSlug(value: string): string {
  return cleanSlugInput(value.trim()).replace(/^-+|-+$/g, "");
}

/** 그룹 참여 화면 주소. sub 는 '/results' 처럼 / 로 시작한다 */
export function eventHref(slug: string, sub = ""): string {
  return `/e/${slug}${sub}`;
}

/**
 * 강점 설명 화면(/strengths)은 그룹에 속하지 않는다. 어느 그룹에서 왔는지를
 * `?from=<slug>` 로 실어 두고, '명단으로' 가 그 그룹으로 돌아가게 한다.
 * 모양이 틀린 값은 버린다 — 주소창에서 아무 글이나 넣을 수 있다.
 */
export function readFromSlug(raw: string | string[] | undefined): string | null {
  return typeof raw === "string" && isValidSlug(raw) ? raw : null;
}

/** 강점 설명 화면 주소. from 이 있으면 실어 둔다 */
export function strengthsHref(from: string | null, sub = ""): string {
  return from === null ? `/strengths${sub}` : `/strengths${sub}?from=${from}`;
}

/** 그룹 관리 화면 주소 */
export function adminEventHref(slug: string, sub = ""): string {
  return `/admin/e/${slug}${sub}`;
}
