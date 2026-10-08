import { describe, expect, it } from "vitest";

import {
  adminEventHref,
  cleanSlugInput,
  eventHref,
  isValidSlug,
  normalizeSlug,
  readFromSlug,
  strengthsHref,
} from "./eventSlug";

describe("isValidSlug", () => {
  it("소문자 · 숫자 · 사이의 하이픈은 받는다", () => {
    expect(isValidSlug("oikos")).toBe(true);
    expect(isValidSlug("leader-mt")).toBe(true);
    expect(isValidSlug("mt2026")).toBe(true);
  });

  it("대문자 · 한글 · 공백 · 밑줄은 받지 않는다", () => {
    expect(isValidSlug("Oikos")).toBe(false);
    expect(isValidSlug("원띵")).toBe(false);
    expect(isValidSlug("leader mt")).toBe(false);
    expect(isValidSlug("leader_mt")).toBe(false);
  });

  it("하이픈이 앞뒤에 있거나 연달아 오면 받지 않는다", () => {
    expect(isValidSlug("-mt")).toBe(false);
    expect(isValidSlug("mt-")).toBe(false);
    expect(isValidSlug("leader--mt")).toBe(false);
  });

  it("너무 짧거나 길면 받지 않는다", () => {
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
    expect(isValidSlug("a".repeat(40))).toBe(true);
  });
});

describe("normalizeSlug", () => {
  it("대문자와 공백을 주소 모양으로 바꾼다", () => {
    expect(normalizeSlug(" Leader MT ")).toBe("leader-mt");
    expect(normalizeSlug("leader_mt")).toBe("leader-mt");
  });

  it("한글과 기호는 지우고 하이픈을 정리한다", () => {
    expect(normalizeSlug("원띵 oikos!")).toBe("oikos");
    expect(normalizeSlug("a -- b")).toBe("a-b");
    expect(normalizeSlug("--mt--")).toBe("mt");
  });

  it("다듬은 결과는 규칙을 통과하거나 빈 문자열이다", () => {
    for (const input of ["Hello World", "청년부", "x", "a_b_c", "2026 MT!!"]) {
      const out = normalizeSlug(input);
      expect(out === "" || out.length < 2 || isValidSlug(out)).toBe(true);
    }
  });
});

describe("cleanSlugInput", () => {
  it("치는 중에는 끝의 하이픈을 남긴다", () => {
    expect(cleanSlugInput("leader-")).toBe("leader-");
    expect(cleanSlugInput("Leader M")).toBe("leader-m");
  });

  it("쓸 수 없는 글자는 바로 지운다", () => {
    expect(cleanSlugInput("원띵a!")).toBe("a");
    expect(cleanSlugInput("a--")).toBe("a-");
  });
});

describe("eventHref", () => {
  it("참여 주소와 관리 주소를 만든다", () => {
    expect(eventHref("oikos")).toBe("/e/oikos");
    expect(eventHref("oikos", "/results")).toBe("/e/oikos/results");
    expect(adminEventHref("oikos", "/people")).toBe("/admin/e/oikos/people");
  });
});

describe("readFromSlug · strengthsHref", () => {
  it("주소 모양인 from 만 받는다", () => {
    expect(readFromSlug("oikos")).toBe("oikos");
    expect(readFromSlug("../admin")).toBeNull();
    expect(readFromSlug(["oikos"])).toBeNull();
    expect(readFromSlug(undefined)).toBeNull();
  });

  it("from 이 있으면 강점 설명 주소에 실어 둔다", () => {
    expect(strengthsHref(null)).toBe("/strengths");
    expect(strengthsHref("oikos")).toBe("/strengths?from=oikos");
    expect(strengthsHref("oikos", "/kindness")).toBe("/strengths/kindness?from=oikos");
  });
});
