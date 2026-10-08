/**
 * 이 기기가 남긴 제출 이력 (5-11).
 *
 * 서버에는 제출자를 식별하는 값이 하나도 없다. 그래서 "이미 남겼어요" 표시는
 * 브라우저가 스스로 기억한다. 저장소를 지우면 표시도 사라지지만,
 * 그 대신 서버에 제출자를 알아볼 수 있는 흔적이 남지 않는다.
 *
 * 순수 함수와 localStorage 접근을 나눠 둔다. 위쪽 함수는 서버에서도
 * 안전하게 부를 수 있고 테스트가 쉽다.
 */

import { STORAGE_KEYS, draftStorageKey } from "./constants";
import { isStrengthCode, type StrengthCode } from "./strengths";

import type { MySubmission } from "@/types/domain";

// ------------------------------------------------------------
// 순수 함수
// ------------------------------------------------------------

function isMySubmission(value: unknown): value is MySubmission {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.personId === "string" &&
    typeof row.createdAt === "string" &&
    isStrengthCode(row.strengthCode) &&
    (row.reason === undefined || typeof row.reason === "string")
  );
}

/**
 * 저장된 문자열을 목록으로 읽는다.
 *
 * 남이 손으로 고쳤거나 예전 판이 남아 있을 수 있으므로
 * 모양이 맞는 줄만 남긴다. 깨졌다고 화면을 멈추지는 않는다.
 */
export function parseSubmissions(raw: string | null): MySubmission[] {
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMySubmission) : [];
  } catch {
    return [];
  }
}

/** 같은 사람에게 같은 강점을 두 번 넣지 않는다 */
export function addSubmission(
  list: readonly MySubmission[],
  entry: MySubmission,
): MySubmission[] {
  return hasSubmitted(list, entry.personId, entry.strengthCode)
    ? [...list]
    : [...list, entry];
}

/** 강점 코드를 주면 그 강점까지, 안 주면 그 사람에게 남긴 적이 있는지 */
export function hasSubmitted(
  list: readonly MySubmission[],
  personId: string,
  strengthCode?: StrengthCode,
): boolean {
  return list.some(
    (row) =>
      row.personId === personId &&
      (strengthCode === undefined || row.strengthCode === strengthCode),
  );
}

/** 한 번이라도 남긴 사람들 */
export function submittedPersonIds(list: readonly MySubmission[]): Set<string> {
  return new Set(list.map((row) => row.personId));
}

/** 그 사람에게 이미 남긴 강점들 */
export function submittedCodesFor(
  list: readonly MySubmission[],
  personId: string,
): Set<StrengthCode> {
  return new Set(
    list.filter((row) => row.personId === personId).map((row) => row.strengthCode),
  );
}

/** 쓰다 만 사유. 한 사람 안에서 강점 코드 → 글 */
export type Drafts = Record<string, string>;

/** 저장된 초안을 읽는다. 모양이 틀린 칸은 버린다 */
export function parseDrafts(raw: string | null): Drafts {
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const out: Drafts = {};
    for (const [code, text] of Object.entries(parsed)) {
      if (isStrengthCode(code) && typeof text === "string" && text.trim() !== "") {
        out[code] = text;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** 그룹 id → '내 이름' 으로 골라둔 사람 id */
export type MeMap = Record<string, string>;

/** 저장된 '내 이름' 들을 읽는다. 모양이 틀린 칸은 버린다 */
export function parseMeMap(raw: string | null): MeMap {
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const out: MeMap = {};
    for (const [eventId, personId] of Object.entries(parsed)) {
      if (typeof personId === "string" && personId !== "") {
        out[eventId] = personId;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** 한 그룹의 '내 이름' 을 바꾼다. null 이면 그 그룹 칸을 지운다. 입력을 바꾸지 않는다 */
export function withMe(map: MeMap, eventId: string, personId: string | null): MeMap {
  const next = { ...map };
  if (personId === null) {
    delete next[eventId];
  } else {
    next[eventId] = personId;
  }
  return next;
}

/** 한 칸을 바꾼다. 빈 글이면 그 칸을 지운다. 입력을 바꾸지 않는다 */
export function withDraft(drafts: Drafts, code: string, text: string): Drafts {
  const next = { ...drafts };
  if (text.trim() === "") {
    delete next[code];
  } else {
    next[code] = text;
  }
  return next;
}

// ------------------------------------------------------------
// localStorage 접근 — 서버에서 불러도 터지지 않게 감싼다
// ------------------------------------------------------------

function readRaw(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    // 시크릿 모드나 저장소 차단. 표시가 안 될 뿐 흐름은 이어져야 한다
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 용량 초과·차단. 저장에 실패해도 제출 자체는 이미 끝났다
  }
}

function removeRaw(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 차단. 남은 초안은 다음에 덮어쓰인다
  }
}

/**
 * 저장소를 하나의 외부 상태로 본다 (useSyncExternalStore).
 *
 * 효과 안에서 setState 로 읽어오면 첫 렌더 뒤에 한 번 더 렌더가 돌고,
 * 그 사이 화면이 잠깐 어긋난다. 서버 스냅숏을 따로 주면 서버 렌더와
 * 하이드레이션이 같은 값을 보고, 그 뒤에 저장소 값으로 한 번에 바뀐다.
 */
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeStorage(onChange: () => void): () => void {
  listeners.add(onChange);
  if (typeof window !== "undefined") {
    // 다른 탭에서 남긴 것도 반영한다
    window.addEventListener("storage", onChange);
  }
  return () => {
    listeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange);
    }
  };
}

/**
 * 스냅숏은 같은 내용이면 같은 객체를 돌려줘야 한다.
 * 부를 때마다 새 배열을 만들면 React 가 계속 바뀌었다고 보고 무한히 다시 그린다.
 */
let cached: { raw: string | null; value: MySubmission[] } | null = null;
const EMPTY: MySubmission[] = [];

export function getSubmissions(): MySubmission[] {
  const raw = readRaw(STORAGE_KEYS.submitted);
  if (cached === null || cached.raw !== raw) {
    cached = { raw, value: parseSubmissions(raw) };
  }
  return cached.value;
}

/** 서버에는 저장소가 없다. 아무것도 남기지 않은 상태로 그린다 */
export function getSubmissionsOnServer(): MySubmission[] {
  return EMPTY;
}

export function saveSubmissions(list: readonly MySubmission[]): void {
  writeRaw(STORAGE_KEYS.submitted, JSON.stringify(list));
  notify();
}

/**
 * 쓰다 만 사유 (5-10).
 *
 * 시트 바깥을 잘못 누르거나 뒤로 가기를 눌러도 쓰던 글이 남아야 한다.
 * 같은 강점을 다시 열면 이어서 쓴다. 저장에 성공하면 지운다.
 * 화면이 다시 그려질 필요가 없으므로 notify 하지 않는다
 */
export function readDraft(personId: string, code: string): string {
  return parseDrafts(readRaw(draftStorageKey(personId)))[code] ?? "";
}

export function saveDraft(personId: string, code: string, text: string): void {
  const key = draftStorageKey(personId);
  const next = withDraft(parseDrafts(readRaw(key)), code, text);
  if (Object.keys(next).length === 0) {
    removeRaw(key);
  } else {
    writeRaw(key, JSON.stringify(next));
  }
}

export function getMyGroup(): string | null {
  return readRaw(STORAGE_KEYS.myGroup);
}

export function getMyGroupOnServer(): null {
  return null;
}

export function saveMyGroup(group: string): void {
  writeRaw(STORAGE_KEYS.myGroup, group);
  notify();
}

/**
 * 내 이름으로 골라둔 사람. 그룹마다 따로 둔다.
 *
 * 홈에서 '내 강점' 을 바로 열고, 내 결과 화면에서 '내가 남긴 강점' 을 보여주기 위한
 * 책갈피다. 서버로 보내지 않으므로 누가 누구인지는 이 기기만 안다.
 * 로그인이 없어서 누구나 아무 이름이나 고를 수 있다 — 그래서 이 값으로
 * 서버에서 무언가를 꺼내 오면 안 된다. 이 기기에 있는 것만 보여준다.
 *
 * 스냅숏은 저장된 글 그대로 돌려준다. 문자열이라 내용이 같으면 같은 값으로 비교된다.
 * 그룹 칸을 꺼내는 일은 훅(useMe)이 한다.
 */
export function getMeRaw(): string | null {
  return readRaw(STORAGE_KEYS.me);
}

export function getMeRawOnServer(): null {
  return null;
}

export function saveMe(eventId: string, personId: string | null): void {
  const next = withMe(parseMeMap(readRaw(STORAGE_KEYS.me)), eventId, personId);
  if (Object.keys(next).length === 0) {
    removeRaw(STORAGE_KEYS.me);
  } else {
    writeRaw(STORAGE_KEYS.me, JSON.stringify(next));
  }
  notify();
}

/**
 * 멱등 키.
 *
 * 같은 키로 두 번 오면 서버가 두 번째를 무시한다. 그래서 버튼을 두 번 눌러도,
 * 통신이 끊겨 다시 시도해도 한 건만 저장된다.
 * randomUUID 는 https 와 localhost 에서만 있어서 없을 때를 대비해 둔다.
 */
export function newSubmissionKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // v4 표시. 서버의 uuid 검사를 통과해야 한다
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
