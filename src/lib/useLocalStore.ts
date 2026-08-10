"use client";

import { useSyncExternalStore } from "react";

import {
  getAuthorName,
  getAuthorNameOnServer,
  getMyGroup,
  getMyGroupOnServer,
  getSubmissions,
  getSubmissionsOnServer,
  subscribeStorage,
} from "./submitted";

import type { MySubmission } from "@/types/domain";

/**
 * localStorage 를 읽는 훅들.
 *
 * 서버 렌더에는 저장소가 없으므로 서버 스냅숏을 따로 준다.
 * 그래야 서버가 그린 화면과 하이드레이션 직후 화면이 같고,
 * 저장소 값은 그 뒤 한 번에 반영된다.
 */

export function useSubmissions(): MySubmission[] {
  return useSyncExternalStore(
    subscribeStorage,
    getSubmissions,
    getSubmissionsOnServer,
  );
}

export function useSavedAuthorName(): string {
  return useSyncExternalStore(
    subscribeStorage,
    getAuthorName,
    getAuthorNameOnServer,
  );
}

export function useSavedGroup(): string | null {
  return useSyncExternalStore(subscribeStorage, getMyGroup, getMyGroupOnServer);
}
