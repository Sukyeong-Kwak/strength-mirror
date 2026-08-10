import { describe, expect, it } from "vitest";

import { filterByQuery, matchesQuery, normalizeName, toChoseong } from "./search";

describe("normalizeName", () => {
  it("공백을 지우고 소문자로 맞춘다", () => {
    expect(normalizeName(" 곽 수경 ")).toBe("곽수경");
    expect(normalizeName("Kim  Yuna")).toBe("kimyuna");
  });
});

describe("toChoseong", () => {
  it("한글 음절을 초성으로 바꾼다", () => {
    expect(toChoseong("곽수경")).toBe("ㄱㅅㄱ");
    expect(toChoseong("빵빵")).toBe("ㅃㅃ");
  });

  it("한글이 아닌 글자는 그대로 둔다", () => {
    expect(toChoseong("김a1")).toBe("ㄱa1");
  });
});

describe("matchesQuery", () => {
  it("빈 질의는 모두 통과시킨다", () => {
    expect(matchesQuery("곽수경", "")).toBe(true);
    expect(matchesQuery("곽수경", "   ")).toBe(true);
  });

  it("이름 일부로 찾는다", () => {
    expect(matchesQuery("곽수경", "수경")).toBe(true);
    expect(matchesQuery("곽수경", "곽")).toBe(true);
    expect(matchesQuery("곽수경", "수영")).toBe(false);
  });

  it("공백을 무시한다", () => {
    expect(matchesQuery("곽 수경", "곽수경")).toBe(true);
    expect(matchesQuery("곽수경", "곽 수경")).toBe(true);
  });

  it("초성으로 찾는다", () => {
    expect(matchesQuery("곽수경", "ㄱㅅㄱ")).toBe(true);
    expect(matchesQuery("곽수경", "ㅅㄱ")).toBe(true);
    expect(matchesQuery("곽수경", "ㄱㅅㅇ")).toBe(false);
  });

  it("초성이 아닌 질의를 초성으로 해석하지 않는다", () => {
    // "가" 를 쳤을 때 'ㄱ' 으로 시작하는 이름이 전부 걸리면 안 된다
    expect(matchesQuery("곽수경", "가")).toBe(false);
  });

  it("영문은 대소문자를 가리지 않는다", () => {
    expect(matchesQuery("Kim Yuna", "yuna")).toBe(true);
  });
});

describe("filterByQuery", () => {
  const people = [{ name: "곽수경" }, { name: "김유나" }, { name: "박지훈" }];

  it("걸리는 것만 남긴다", () => {
    expect(filterByQuery(people, "ㄱ")).toEqual([{ name: "곽수경" }, { name: "김유나" }]);
  });

  it("입력 배열을 바꾸지 않는다", () => {
    filterByQuery(people, "김");
    expect(people).toHaveLength(3);
  });
});
