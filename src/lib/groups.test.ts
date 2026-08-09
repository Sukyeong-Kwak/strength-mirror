import { describe, expect, it } from "vitest";

import {
  collectGroupNames,
  compareNatural,
  sortGroupNames,
  toGroupLabel,
} from "./groups";

describe("sortGroupNames", () => {
  it("숫자를 자연 정렬한다 — 10조가 2조 뒤로 간다", () => {
    expect(sortGroupNames(["10조", "2조", "1조"])).toEqual([
      "1조",
      "2조",
      "10조",
    ]);
  });

  it("두 자리 이상도 순서가 맞는다", () => {
    expect(sortGroupNames(["3조", "21조", "11조", "2조"])).toEqual([
      "2조",
      "3조",
      "11조",
      "21조",
    ]);
  });

  it("미지정은 언제나 마지막", () => {
    expect(sortGroupNames(["미지정", "2조", "1조"])).toEqual([
      "1조",
      "2조",
      "미지정",
    ]);
    expect(sortGroupNames(["미지정"])).toEqual(["미지정"]);
    expect(sortGroupNames(["미지정", "가나다조"])).toEqual([
      "가나다조",
      "미지정",
    ]);
  });

  it("숫자로 시작하는 이름이 글자로 시작하는 이름보다 앞선다", () => {
    expect(sortGroupNames(["A팀", "10조", "2조", "청년부"]).slice(0, 2)).toEqual(
      ["2조", "10조"],
    );
  });

  it("같은 문자 체계 안에서는 사전순으로 정렬한다", () => {
    // 한글끼리 · 영문끼리의 순서만 확인한다.
    // 한글과 영문 사이의 순서는 로케일 구현에 달려 있으므로 단정하지 않는다
    expect(sortGroupNames(["다조", "가조", "나조"])).toEqual([
      "가조",
      "나조",
      "다조",
    ]);
    expect(sortGroupNames(["C팀", "A팀", "B팀"])).toEqual([
      "A팀",
      "B팀",
      "C팀",
    ]);
  });

  it("같은 접두사에서 숫자 부분으로 비교한다", () => {
    expect(sortGroupNames(["청년2부", "청년10부", "청년1부"])).toEqual([
      "청년1부",
      "청년2부",
      "청년10부",
    ]);
  });

  it("빈 배열과 한 개짜리를 처리한다", () => {
    expect(sortGroupNames([])).toEqual([]);
    expect(sortGroupNames(["1조"])).toEqual(["1조"]);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const input = ["10조", "1조"];
    sortGroupNames(input);
    expect(input).toEqual(["10조", "1조"]);
  });
});

describe("compareNatural", () => {
  it("같은 값이면 0", () => {
    expect(compareNatural("1조", "1조")).toBe(0);
  });

  it("접두사가 같고 길이가 다르면 짧은 쪽이 앞", () => {
    expect(compareNatural("1조", "1조A")).toBeLessThan(0);
  });
});

describe("toGroupLabel", () => {
  it("null 과 공백을 미지정으로 바꾼다", () => {
    expect(toGroupLabel(null)).toBe("미지정");
    expect(toGroupLabel("   ")).toBe("미지정");
  });

  it("값이 있으면 그대로 둔다", () => {
    expect(toGroupLabel("1조")).toBe("1조");
  });
});

describe("collectGroupNames", () => {
  it("중복을 제거하고 정렬하며 미지정을 뒤로 보낸다", () => {
    expect(
      collectGroupNames([
        { groupName: "2조" },
        { groupName: null },
        { groupName: "10조" },
        { groupName: "2조" },
        { groupName: "1조" },
      ]),
    ).toEqual(["1조", "2조", "10조", "미지정"]);
  });

  it("빈 목록이면 빈 배열", () => {
    expect(collectGroupNames([])).toEqual([]);
  });
});
