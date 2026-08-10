import { describe, expect, it } from "vitest";

import { hasFinalConsonant, josa } from "./korean";

describe("hasFinalConsonant", () => {
  it("받침이 있으면 true", () => {
    expect(hasFinalConsonant("호기심")).toBe(true);
    expect(hasFinalConsonant("정직")).toBe(true);
  });

  it("받침이 없으면 false", () => {
    expect(hasFinalConsonant("용서")).toBe(false);
    expect(hasFinalConsonant("친절하기")).toBe(false);
  });

  it("한글이 아닌 글자로 끝나면 받침이 없는 것으로 본다", () => {
    expect(hasFinalConsonant("Zest")).toBe(false);
    expect(hasFinalConsonant("")).toBe(false);
  });

  it("뒤에 붙은 공백에 속지 않는다", () => {
    expect(hasFinalConsonant("호기심 ")).toBe(true);
  });
});

describe("josa", () => {
  it("와/과", () => {
    expect(josa("호기심", "와/과")).toBe("과");
    expect(josa("용서", "와/과")).toBe("와");
  });

  it("은/는 · 이/가 · 을/를", () => {
    expect(josa("정직", "은/는")).toBe("은");
    expect(josa("용서", "은/는")).toBe("는");
    expect(josa("정직", "이/가")).toBe("이");
    expect(josa("용서", "이/가")).toBe("가");
    expect(josa("정직", "을/를")).toBe("을");
    expect(josa("용서", "을/를")).toBe("를");
  });
});
