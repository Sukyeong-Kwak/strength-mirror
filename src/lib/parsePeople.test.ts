import { describe, expect, it } from "vitest";

import {
  markExisting,
  parsePeopleText,
  toStandardFormat,
  type ParsedPerson,
} from "./parsePeople";

/** 비교하기 쉽게 핵심 필드만 뽑는다 */
function summarize(people: ParsedPerson[]) {
  return people.map((p) => ({
    name: p.name,
    groupName: p.groupName,
    status: p.status,
  }));
}

describe("parsePeopleText — 기본 형태", () => {
  it("줄바꿈만 있는 단순 목록", () => {
    expect(summarize(parsePeopleText("김수경\n이서율\n박상윤"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
      { name: "박상윤", groupName: null, status: "new" },
    ]);
  });

  it("쉼표로 구분된 한 줄", () => {
    expect(summarize(parsePeopleText("김수경, 이서율,박상윤"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
      { name: "박상윤", groupName: null, status: "new" },
    ]);
  });

  it("여러 구분자를 함께 쓴 줄", () => {
    expect(summarize(parsePeopleText("김수경 / 이서율 · 박상윤 | 최지훈"))).toEqual(
      [
        { name: "김수경", groupName: null, status: "new" },
        { name: "이서율", groupName: null, status: "new" },
        { name: "박상윤", groupName: null, status: "new" },
        { name: "최지훈", groupName: null, status: "new" },
      ],
    );
  });

  it("공백 2칸으로도 나뉘고, 1칸은 이름의 일부로 둔다", () => {
    expect(summarize(parsePeopleText("김수경   이서율"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
    ]);
    expect(summarize(parsePeopleText("Mary Jane"))).toEqual([
      { name: "Mary Jane", groupName: null, status: "new" },
    ]);
  });

  it("\\r\\n 줄바꿈을 처리한다", () => {
    expect(summarize(parsePeopleText("김수경\r\n이서율"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
    ]);
  });
});

describe("parsePeopleText — 접두·접미 제거", () => {
  it("번호 매김을 지운다", () => {
    expect(summarize(parsePeopleText("1. 김수경\n2) 이서율\n③ 박상윤"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
      { name: "박상윤", groupName: null, status: "new" },
    ]);
  });

  it("목록 기호를 지운다", () => {
    expect(summarize(parsePeopleText("- 김수경\n* 이서율\n• 박상윤\n> 최지훈"))).toEqual(
      [
        { name: "김수경", groupName: null, status: "new" },
        { name: "이서율", groupName: null, status: "new" },
        { name: "박상윤", groupName: null, status: "new" },
        { name: "최지훈", groupName: null, status: "new" },
      ],
    );
  });

  it("역할 표기와 호칭을 지우고 원문은 raw 에 남긴다", () => {
    const parsed = parsePeopleText("김수경(리더), 이서율[조장], 박상윤 형제, 최지훈님");
    expect(parsed.map((p) => p.name)).toEqual([
      "김수경",
      "이서율",
      "박상윤",
      "최지훈",
    ]);
    expect(parsed.map((p) => p.raw)).toEqual([
      "김수경(리더)",
      "이서율[조장]",
      "박상윤 형제",
      "최지훈님",
    ]);
  });
});

describe("parsePeopleText — 그룹", () => {
  it("그룹 헤더 뒤의 이름들에 그룹을 붙인다", () => {
    const input = "1조\n김수경\n이서율\n\n2조\n박상윤, 최지훈";
    expect(summarize(parsePeopleText(input))).toEqual([
      { name: "김수경", groupName: "1조", status: "new" },
      { name: "이서율", groupName: "1조", status: "new" },
      { name: "박상윤", groupName: "2조", status: "new" },
      { name: "최지훈", groupName: "2조", status: "new" },
    ]);
  });

  it("장식 문자와 콜론이 붙은 헤더도 알아본다", () => {
    const input = "■ 2조\n김수경\n\n3조:\n이서율\n\nA팀\n박상윤\n\n청년1부\n최지훈";
    expect(summarize(parsePeopleText(input))).toEqual([
      { name: "김수경", groupName: "2조", status: "new" },
      { name: "이서율", groupName: "3조", status: "new" },
      { name: "박상윤", groupName: "A팀", status: "new" },
      { name: "최지훈", groupName: "청년1부", status: "new" },
    ]);
  });

  it("그룹 헤더 없이 시작하면 groupName 이 null 이다", () => {
    expect(summarize(parsePeopleText("김수경\n이서율\n\n1조\n박상윤"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
      { name: "박상윤", groupName: "1조", status: "new" },
    ]);
  });

  it("숫자나 영문이 없는 낱말은 헤더로 보지 않는다", () => {
    expect(summarize(parsePeopleText("청년부\n김수경"))).toEqual([
      { name: "청년부", groupName: null, status: "new" },
      { name: "김수경", groupName: null, status: "new" },
    ]);
  });
});

describe("parsePeopleText — 상태 판정", () => {
  it("같은 이름이 두 번 나오면 두 번째가 duplicate_in_input", () => {
    expect(summarize(parsePeopleText("김수경\n이서율\n김수경"))).toEqual([
      { name: "김수경", groupName: null, status: "new" },
      { name: "이서율", groupName: null, status: "new" },
      { name: "김수경", groupName: null, status: "duplicate_in_input" },
    ]);
  });

  it("조가 다르면 같은 이름이라도 중복이 아니다", () => {
    const input = "1조\n김수경\n\n2조\n김수경";
    expect(summarize(parsePeopleText(input))).toEqual([
      { name: "김수경", groupName: "1조", status: "new" },
      { name: "김수경", groupName: "2조", status: "new" },
    ]);
  });

  it("영문 대소문자만 다른 이름은 같은 것으로 본다", () => {
    expect(summarize(parsePeopleText("Mary\nmary"))).toEqual([
      { name: "Mary", groupName: null, status: "new" },
      { name: "mary", groupName: null, status: "duplicate_in_input" },
    ]);
  });

  it("전화번호가 섞이면 needs_review", () => {
    expect(summarize(parsePeopleText("김수경 010-1234-5678"))).toEqual([
      { name: "김수경 010-1234-5678", groupName: null, status: "needs_review" },
    ]);
  });

  it("이메일·숫자만·한 글자·너무 긴 이름은 needs_review", () => {
    expect(
      summarize(
        parsePeopleText("abc@example.com\n12345\n김\n김수경김수경김수경김수경김"),
      ),
    ).toEqual([
      { name: "abc@example.com", groupName: null, status: "needs_review" },
      { name: "12345", groupName: null, status: "needs_review" },
      { name: "김", groupName: null, status: "needs_review" },
      {
        name: "김수경김수경김수경김수경김",
        groupName: null,
        status: "needs_review",
      },
    ]);
  });
});

describe("parsePeopleText — 빈 입력", () => {
  it("빈 문자열은 빈 배열", () => {
    expect(parsePeopleText("")).toEqual([]);
  });

  it("공백과 줄바꿈만 있어도 빈 배열", () => {
    expect(parsePeopleText("   \n\n \t \n")).toEqual([]);
  });

  it("기호만 있는 줄은 건너뛴다", () => {
    expect(parsePeopleText("- \n1.\n•")).toEqual([]);
  });
});

describe("markExisting", () => {
  it("이름과 조가 모두 같을 때만 already_exists 로 바꾼다", () => {
    const parsed = parsePeopleText("1조\n김수경\n이서율\n\n2조\n김수경");
    const marked = markExisting(parsed, [{ name: "김수경", groupName: "1조" }]);
    expect(summarize(marked)).toEqual([
      { name: "김수경", groupName: "1조", status: "already_exists" },
      { name: "이서율", groupName: "1조", status: "new" },
      { name: "김수경", groupName: "2조", status: "new" },
    ]);
  });

  it("이미 duplicate_in_input 인 항목은 그대로 둔다", () => {
    const parsed = parsePeopleText("김수경\n김수경");
    const marked = markExisting(parsed, [{ name: "김수경", groupName: null }]);
    expect(summarize(marked)).toEqual([
      { name: "김수경", groupName: null, status: "already_exists" },
      { name: "김수경", groupName: null, status: "duplicate_in_input" },
    ]);
  });

  it("DB 가 비어 있으면 아무것도 바뀌지 않는다", () => {
    const parsed = parsePeopleText("김수경");
    expect(markExisting(parsed, [])).toEqual(parsed);
  });
});

describe("toStandardFormat 왕복", () => {
  it("정돈된 입력은 완전히 같은 결과로 돌아온다", () => {
    const parsed = parsePeopleText("1조\n김수경\n이서율\n\n2조\n박상윤");
    expect(parsePeopleText(toStandardFormat(parsed))).toEqual(parsed);
  });

  it("지저분한 입력도 이름·조·상태가 그대로 유지된다", () => {
    const messy =
      "■ 1조\n1. 김수경(리더)\n2) 이서율님\n\n2조:\n박상윤 형제, 최지훈\n\n김수경";
    const parsed = parsePeopleText(messy);
    const round = parsePeopleText(toStandardFormat(parsed));
    expect(summarize(round)).toEqual(summarize(parsed));
  });

  it("조가 없는 사람이 있어도 왕복이 유지된다", () => {
    const parsed = parsePeopleText("김수경\n이서율\n\n1조\n박상윤");
    expect(parsePeopleText(toStandardFormat(parsed))).toEqual(parsed);
  });

  it("빈 목록은 빈 문자열", () => {
    expect(toStandardFormat([])).toBe("");
    expect(parsePeopleText(toStandardFormat([]))).toEqual([]);
  });
});
