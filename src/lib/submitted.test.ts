import { describe, expect, it } from "vitest";

import {
  addSubmission,
  hasSubmitted,
  newSubmissionKey,
  parseSubmissions,
  submittedCodesFor,
  submittedPersonIds,
} from "./submitted";

import type { MySubmission } from "@/types/domain";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

function entry(personId: string, code: MySubmission["strengthCode"]): MySubmission {
  return { personId, strengthCode: code, createdAt: "2026-08-10T00:00:00.000Z" };
}

describe("parseSubmissions", () => {
  it("없으면 빈 목록", () => {
    expect(parseSubmissions(null)).toEqual([]);
  });

  it("깨진 문자열에도 터지지 않는다", () => {
    expect(parseSubmissions("{{{")).toEqual([]);
    expect(parseSubmissions('"문자열"')).toEqual([]);
  });

  it("모양이 맞지 않는 줄은 버린다", () => {
    const raw = JSON.stringify([
      entry(A, "creativity"),
      { personId: A, strengthCode: "없는강점", createdAt: "x" },
      { personId: 1, strengthCode: "curiosity", createdAt: "x" },
    ]);
    expect(parseSubmissions(raw)).toEqual([entry(A, "creativity")]);
  });
});

describe("addSubmission", () => {
  it("같은 사람의 같은 강점은 두 번 넣지 않는다", () => {
    const list = [entry(A, "creativity")];
    expect(addSubmission(list, entry(A, "creativity"))).toHaveLength(1);
  });

  it("다른 강점은 더한다", () => {
    const list = [entry(A, "creativity")];
    expect(addSubmission(list, entry(A, "curiosity"))).toHaveLength(2);
  });

  it("같은 강점이라도 사람이 다르면 더한다", () => {
    const list = [entry(A, "creativity")];
    expect(addSubmission(list, entry(B, "creativity"))).toHaveLength(2);
  });

  it("입력 배열을 바꾸지 않는다", () => {
    const list = [entry(A, "creativity")];
    addSubmission(list, entry(A, "curiosity"));
    expect(list).toHaveLength(1);
  });
});

describe("hasSubmitted", () => {
  const list = [entry(A, "creativity")];

  it("강점을 주면 그 강점까지 본다", () => {
    expect(hasSubmitted(list, A, "creativity")).toBe(true);
    expect(hasSubmitted(list, A, "curiosity")).toBe(false);
  });

  it("강점을 안 주면 그 사람에게 남긴 적이 있는지만 본다", () => {
    expect(hasSubmitted(list, A)).toBe(true);
    expect(hasSubmitted(list, B)).toBe(false);
  });
});

describe("모아 보기", () => {
  const list = [entry(A, "creativity"), entry(A, "curiosity"), entry(B, "bravery")];

  it("남긴 사람들", () => {
    expect(submittedPersonIds(list)).toEqual(new Set([A, B]));
  });

  it("그 사람에게 남긴 강점들", () => {
    expect(submittedCodesFor(list, A)).toEqual(new Set(["creativity", "curiosity"]));
  });
});

describe("newSubmissionKey", () => {
  it("uuid v4 모양이다", () => {
    expect(newSubmissionKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("부를 때마다 다르다", () => {
    expect(newSubmissionKey()).not.toBe(newSubmissionKey());
  });
});
