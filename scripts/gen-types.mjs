/**
 * Supabase 타입 생성.
 *
 * package.json 에 셸 한 줄로 두면 Windows 의 cmd.exe 에서 깨진다.
 * grep · cut · $(...) · mv 가 없기 때문이다. 그래서 Node 로 옮겼다.
 *
 *   npm run gen:types
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "node:fs";

const ENV_FILE = ".env.local";
const ENV_KEY = "SUPABASE_PROJECT_ID";
const OUT_FILE = "src/types/database.ts";
const TMP_FILE = "src/types/database.next.ts";

/**
 * Supabase reference id 는 소문자 영숫자 20자다.
 * 형식을 보는 김에 셸 메타문자도 걸러진다 (아래 spawnSync 의 shell 옵션).
 */
const PROJECT_ID_PATTERN = /^[a-z0-9]{20}$/;

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint !== undefined) {
    console.error(`\n${hint}`);
  }
  console.error("");
  process.exit(1);
}

/** .env.local 에서 키 하나를 읽는다. 따옴표와 주석을 걷어낸다 */
function readEnvValue(file, key) {
  const text = readFileSync(file, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1 || trimmed.slice(0, eq).trim() !== key) {
      continue;
    }
    return trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return "";
}

if (!existsSync(ENV_FILE)) {
  fail(
    `${ENV_FILE} 이 없어요.`,
    `먼저 만들어주세요.\n\n  cp .env.example .env.local\n\n` +
      `그리고 ${ENV_KEY} 에 Supabase 의 Reference ID 를 넣으세요.\n` +
      `(대시보드 → Project Settings → General → Reference ID)`,
  );
}

const projectId = readEnvValue(ENV_FILE, ENV_KEY);

if (projectId === "") {
  fail(
    `${ENV_FILE} 의 ${ENV_KEY} 가 비어 있어요.`,
    `Supabase 대시보드 → Project Settings → General → Reference ID 를 넣으세요.`,
  );
}

if (!PROJECT_ID_PATTERN.test(projectId)) {
  fail(
    `${ENV_KEY} 형식이 Reference ID 같지 않아요.`,
    `Reference ID 는 소문자 영숫자 20자입니다.\n` +
      `Project URL 이 https://abcdefghijklmnopqrst.supabase.co 라면\n` +
      `가운데 abcdefghijklmnopqrst 부분입니다.\n` +
      `(URL 전체나 API 키를 넣지 않았는지 확인해주세요)`,
  );
}

console.log(`Supabase 에서 타입을 받아옵니다 (project ${projectId}) ...`);

const result = spawnSync(
  "npx",
  [
    "--yes",
    "supabase@latest",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  {
    encoding: "utf8",
    // Windows 에서 npx 는 npx.cmd 라 셸을 거쳐야 한다.
    // projectId 는 위에서 형식을 검증했으므로 셸에 넘겨도 안전하다
    shell: process.platform === "win32",
    maxBuffer: 32 * 1024 * 1024,
  },
);

if (result.error !== undefined) {
  fail("supabase CLI 를 실행하지 못했어요.", String(result.error.message ?? result.error));
}

if (result.status !== 0) {
  const stderr = (result.stderr ?? "").trim();
  const loggedOut = /login|token|unauthor/i.test(stderr);
  fail(
    "타입을 받아오지 못했어요.",
    (loggedOut ? "로그인이 필요해 보여요.\n\n  npx supabase login\n\n" : "") +
      (stderr === "" ? "(supabase CLI 가 아무 메시지도 주지 않았어요)" : stderr),
  );
}

const output = result.stdout ?? "";

// 빈 출력이나 오류 메시지를 그대로 덮어쓰면 타입 파일이 통째로 날아간다.
// 원래 셸 스크립트가 && 로 지키던 안전장치를 여기서도 지킨다
if (!output.includes("export type Database")) {
  fail(
    "받아온 내용이 타입 파일 같지 않아 덮어쓰지 않았어요.",
    `${OUT_FILE} 은 그대로 두었습니다.\n\n${output.slice(0, 400)}`,
  );
}

writeFileSync(TMP_FILE, output, "utf8");
try {
  renameSync(TMP_FILE, OUT_FILE);
} catch (error) {
  unlinkSync(TMP_FILE);
  fail(`${OUT_FILE} 에 쓰지 못했어요.`, String(error));
}

const lines = output.split("\n").length;
console.log(`✓ ${OUT_FILE} 을 새로 만들었어요 (${lines}줄)`);
console.log("  이어서 npm run typecheck 로 확인해보세요.");
