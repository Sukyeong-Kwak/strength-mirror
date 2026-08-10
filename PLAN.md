# 진행 계획

VIA 강점 피드백 웹앱. 명세서는 별도 문서에 있고, 이 파일은 **어디까지 했고 다음에 무엇을 하는지**만 적는다.

최종 갱신: 2026-08-10

---

## 1. 다른 컴퓨터에서 이어가기

```bash
git clone https://github.com/Sukyeong-Kwak/strength-mirror.git
cd strength-mirror
npm install
cp .env.example .env.local     # 값은 아래에서 채운다
```

`.env.local` 에 채울 값 3개 (저장소에 없다):

| 키 | 어디서 얻나 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 화면의 anon / public 키 |
| `SUPABASE_PROJECT_ID` | Project Settings → General → Reference ID |

> 비밀값은 없다. 세 개 다 대시보드에서 그대로 복사하면 된다.

그다음:

```bash
npx supabase login      # 타입 생성에 필요. 브라우저가 열린다
npm run gen:types       # src/types/database.ts 재생성
npm run typecheck && npm test && npm run build
npm run dev
```

확인용 명령:

```bash
npm test          # Vitest 67개
npm run typecheck # tsc --noEmit
npm run lint
```

---

## 2. 확정된 결정

명세와 달라진 부분과, 물어보고 정한 것들. **다시 논의하지 말 것.**

| 항목 | 결정 | 이유 |
|---|---|---|
| Tailwind | v4 (`@theme` 블록이 설정 위치, `tailwind.config.ts` 없음) | create-next-app 기본값 |
| 폰트 | 본문 Pretendard(가변 woff2 self-host) + 표제 **Hahmlet**(`next/font/google`) | 외부 CDN 의존 제거. 빌드 때 받아 함께 배포한다 |
| 표제 서체 선택 | 간판체(도현체·한나체 등)를 쓰지 않는다 | 6-4 의 평면적인 종이 화면과 겉돈다. 굵기도 한 벌뿐이라 위계를 못 만든다 |
| 표제 서체 적용 범위 | **h1 제목(600) + 사람·강점 이름(500).** 명세 6-3 을 넓혔다 | 이름에만 쓰니 존재감이 없어 화면 전체가 한 글꼴처럼 밋밋했다 |
| h2 | 표제 서체를 쓰지 않는다 | 대부분 14px 섹션 라벨이라 씌우면 위계가 흐려진다 |
| 명단에서 빼기 | **숨김과 삭제 둘 다.** 숨김이 기본 동선 | 삭제는 받은 글까지 cascade 로 지운다. 되돌릴 수 없어서 기본으로 권하지 않는다 |
| 숨긴 사람과 게이트 | 결과 공개 게이트·집계·조별 합계에서 뺀다 | 안 그러면 숨긴 한 명이 결과를 영영 막는다 |
| 서체 교체 지점 | **`src/lib/fonts.ts` 한 곳.** globals.css 는 변수만 본다 | 컴포넌트마다 적어두면 바꿀 때 빠뜨린다. `/fonts` 에서 후보를 눈으로 비교한다 |
| 덕목 6색 | 흰 배경 기준으로 **계산해서** 뽑는다. 눈으로 고르지 않는다 | 이전 팔레트는 인간애↔용기 ΔE 9.4 로 정상 시력에서도 구분이 어려웠다 |
| 글자용 덕목 색 | `-ink` 변형을 따로 둔다 | 막대 색을 글자에 쓰면 절제가 2.9:1 이라 읽히지 않는다 |
| 테스트 | Vitest만 추가 (Testing Library 미사용) | 순수 함수만 테스트 |
| 5-4 최다 수신자 표시 | **구현하지 않음** | "특정 인물이 몇 개 받았는지 알 수 없게" 원칙과 충돌 |
| 기기 식별 | **쓰지 않는다.** `client_hash`·pepper·`app_config`·`get_my_submissions` 전부 제거 | 식별자가 localStorage 에 있어서 서버에 물어도 얻는 게 없었다. 중복 점검 화면 하나를 포기하고 pepper 관리 부담을 없앤다 |
| 중복 제출 방지 | `submission_key` (클라이언트가 만드는 멱등 키) | 기기 식별과 무관하다. 두 번 눌러도 한 번만 저장된다 |
| "이전에 남김" 표시 | localStorage (`via:submitted:v1`) | 서버에 제출자 식별값을 남기지 않는다 |
| 비율 눈금 | **5% 단위.** 20칸 위에서 최대잔여법 | 1% 로 내려주면 건수를 역산할 수 있다 (8% = 12건 중 1건) |
| 5% 눈금과 합계 | 각자 반올림하지 않는다. 20칸 최대잔여법으로 **합계 정확히 100** | 각자 반올림하면 합이 95~105 로 흩어져 덕목별 보기 소계가 어긋난다 |
| 5% 미만 강점 | 막대 대신 이름만 "이런 강점도 받았어요" 로 | 누군가 골라준 강점이 화면에서 흔적도 없이 사라지지 않게 |
| 사유 목록 게이트 | `feedback_reasons_public` 에도 공개 게이트 적용 | 사유 카드 수를 세면 그 사람이 받은 강점 수가 된다 |
| 제출 단위 | **강점 하나씩 즉시 제출.** 저장 직전에 "고칠 수 없어요" 확인을 한 번 둔다 | 여러 개를 골라두고 마지막에 몰아 쓰게 하면 사유를 쓰다 지쳐 앞의 선택을 지운다 |
| 작성자 이름 | **익명이 기본, 원하면 이름.** 직전에 적은 이름을 기억한다 | 하나씩 남기는 흐름이라 매번 다시 적게 하면 결국 아무도 적지 않는다 |
| 이름 찾기 | 부분 일치 + 공백 무시 + **초성 검색**. 전부 브라우저에서 | 명단은 많아야 수백 명이라 글자마다 서버에 묻는 것보다 빠르다 |
| 참여자 화면 조회 | `lib/data/people.ts` 로 분리. `lib/auth/dal.ts` 를 쓰지 않는다 | 로그인 없이 열리는 화면이다. 섞어두면 언젠가 requireAdmin 이 딸려 들어간다 |
| 저장소 읽기 | `useSyncExternalStore` (`lib/useLocalStore.ts`) | 효과 안 setState 는 lint 가 막고, 첫 렌더 뒤 화면이 한 번 어긋난다 |
| 관리자 로그인 | **이메일 인증번호(OTP)만.** Google OAuth 는 쓰지 않는다 | 설정 단계를 줄인다 |
| OTP 계정 생성 | `shouldCreateUser: false`. 계정은 Supabase 대시보드에서 미리 만든다 | 아무나 코드를 요청해 메일 할당량을 소진시키는 것을 막는다 |
| 메일 발송 | Resend 커스텀 SMTP | Supabase 기본 SMTP 는 시간당 발송 제한이 매우 낮다 |
| 관리자 권한 확인 | 레이아웃 게이트가 아니라 **DAL** (`lib/auth/dal.ts`) | 레이아웃은 그 아래 page 실행도 RSC 페이로드 노출도 막지 못한다 (Next 문서 명시) |
| 에러 바운더리 prop | `reset` 이 아니라 **`retry`** | Next 16.3.0 에서 정식화됐다. `reset` 은 데이터를 다시 가져오지 않는다 |
| 강점 이름·차례 | VIA 공식 분류 + 국내 표 번역어(표 1. Strengths Finder). 통찰·용감성·진실성·신중성·자기통제력·유머감각, 덕목은 정의감·절제력·영성과 초월성 | 참가자가 손에 든 검사지와 같은 말이어야 한다. 인간애는 친절 → 사랑 차례다 |
| 버튼 모양 | `components/Button.tsx` 한 곳 — `Button`·`Chip`·`buttonClass` | 밑줄 글자 버튼과 손으로 베낀 칩 클래스가 화면마다 따로 놀았다 |
| 시트 포커스 | 효과 의존성에서 `onClose` 를 뺀다 (ref 로 들고 본다) | 부모가 다시 그릴 때마다 포커스가 시트로 되돌아가 입력칸에 글이 안 써졌다 |
| 집계 보기 전환 | URL 쿼리 `?view=`·`?group=`. 클라이언트 상태를 쓰지 않는다 | 서버가 그린 그대로 끝나는 화면이다. 새로 고침·공유 링크에서 보던 화면이 유지된다 |

---

## 3. 진행 상황

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 셋업 (Next 16, TS strict, 덕목 색·서체) | 완료 |
| 2 | DB 스키마 (테이블 6 · 뷰 11 · RPC 1 · RLS) | 완료 · **재실행 필요** (아래 4-1) |
| 3 | 타입 생성 + Supabase 클라이언트 | 완료 |
| 4 | 관리자 인증 (OTP 전용) + 리뷰 반영 | 완료 |
| 5 | 명단 파서 `parsePeople.ts` | 완료 (테스트 27) |
| 6 | 명단 일괄 등록 화면 `/admin/people/import` | 완료 |
| 6-1 | 명단 관리 `/admin/people` — 숨김·삭제 | 완료 |
| 7 | 제출 이력 localStorage (`submitted.ts`) | 완료 (테스트 15) |
| 8 | 홈 (조 필터·검색·사람 목록) | 완료 · 초성 검색 포함 (테스트 9) |
| 9 | 조 참여 흐름 | 일부 — 마지막에 본 조를 기억한다. 진행 카드는 12단계와 함께 |
| 10 | 강점 등록 (`/p/[id]`) — 고르기 → 사유 → 확인 → 저장 | 완료 · **하나씩 제출로 바뀜** |
| 11 | 차트 컴포넌트 (`RatioBar` · `VirtueStack`) | 완료 · 5% 눈금 · 0% 는 이름만 |
| 12 | 개인 결과 페이지 (`/p/[id]/result`) | 완료 · 사유 카드 포함 |
| 13 | 전체 통계 페이지 (`/results`) | 완료 · 조별 보기 포함 |
| 14 | 모바일 QA → 태블릿 확장 | 미착수 |
| 15 | README + Vercel 배포 | 미착수 |

이미 만든 순수 함수 라이브러리: `groups.ts`(14) · `ratio.ts`(26) · `parsePeople.ts`(27) ·
`search.ts`(9) · `submitted.ts`(15) — 테스트 91개 통과.

참여자 화면 파일:

| 파일 | 하는 일 |
|---|---|
| `lib/data/people.ts` | 로그인 없이 여는 명단 조회 (`listPeople` · `getPerson`) |
| `lib/search.ts` | 이름 찾기 — 부분 일치 · 공백 무시 · 초성 |
| `lib/submitted.ts` | 이 기기가 남긴 이력 + 멱등 키 생성 |
| `lib/useLocalStore.ts` | 저장소를 읽는 훅 (`useSyncExternalStore`) |
| `actions/submitFeedback.ts` | 강점 하나를 남기는 유일한 쓰기 경로 |
| `features/home/PeopleBrowser.tsx` | 조 칩 · 검색 · 사람 카드 |
| `features/feedback/StrengthBoard.tsx` | 24강점 카드 → 사유 → 확인 → 저장 |
| `features/strengths/StrengthBody.tsx` | 설명 본문. 시트와 `/strengths` 가 같이 쓴다 |
| `lib/data/results.ts` | 집계 조회 (비율만. 건수 컬럼이 애초에 없다) |
| `components/RatioBar.tsx` | 비율 막대 · 덕목 스택 막대 |
| `features/results/ResultChart.tsx` | 강점별·덕목별 보기. 개인과 전체가 같이 쓴다 |
| `features/results/LockedNotice.tsx` | 게이트가 잠겼을 때. 남은 사람 수만 알려준다 |

---

## 4. 다음에 할 일 — 우선순위 순

4-1(로그인 OTP 전환) · 4-2(보안) · 4-3(정확성) 지적 34건은 **전부 반영했다.**
커밋 `6a694a7` · `fcb1ff3` · 5% 눈금 커밋을 참고.

남은 것은 화면이다. 명세의 구현 순서를 그대로 따른다.

### 4-0. 권한(GRANT) 빠뜨림 — 2026-08-10 확인

배포된 홈(`/`)이 500 이던 원인이다. RLS 정책만 고치고 GRANT 를 안 고쳐서 생겼다.
**권한이 먼저 걸리고 그다음에 RLS 정책을 본다.** 정책만 있으면 42501 로 막힌다.

| 증상 | 원인 |
|---|---|
| `/` 가 500, `hidden_at` 을 빼면 조회됨 | `grant select (…)` 컬럼 목록에 `hidden_at` 이 없었다 |
| 명단 관리의 숨기기·삭제가 실패 | `people` 에 update·delete GRANT 가 아예 없었다 |

`people` 컬럼을 더할 때마다 `grant select (…)` 줄을 같이 고쳐야 한다.
컬럼 단위 권한은 목록에 없는 컬럼 하나 때문에 **select 전체**가 거절된다.

### 4-1. 스키마 재실행 (코드보다 먼저)

`supabase/schema.sql` 을 다시 실행해야 아래 두 가지가 반영된다.

- 마지막 관리자 보호 트리거 (`prevent_last_admin_delete`)
- **비율 뷰 6개의 5% 눈금** — 지금 DB 에 있는 뷰는 아직 1% 단위다
- **기기 식별 제거** — `client_hash` 컬럼, `app_config`, `device_pepper()`,
  `get_my_submissions()` 를 걷어낸다
- **숨김·삭제** — `people.hidden_at` 컬럼, 관리자 전용 update·delete 정책,
  활동 기록에 `hide_person`·`restore_person`·`delete_person` 추가

채워 넣을 값은 없다. 파일 전체를 붙여넣고 그대로 실행하면 된다.

> 재실행이 **반드시** 필요하다. 기존 DB 에는 `client_hash` 가 `not null` 로
> 남아 있어서, 새 `submit_feedback` 이 그 컬럼 없이 INSERT 하면 실패한다.
> 스키마 1-1 절이 이것을 정리한다.

재실행 뒤 확인:

```sql
-- 기기 식별 흔적이 없어야 한다 (셋 다 0행)
select 1 from information_schema.columns
 where table_name = 'feedbacks' and column_name = 'client_hash';
select 1 from information_schema.tables where table_name = 'app_config';
select 1 from information_schema.routines
 where routine_name in ('device_pepper', 'get_my_submissions');

-- 비율이 전부 5의 배수이고 사람별 합이 정확히 100 인지
select person_id, sum(ratio), bool_and(ratio % 5 = 0)
from public.person_strength_ratio group by person_id;
```

> 마지막 쿼리는 게이트가 잠겨 있으면(5개 미만인 사람이 있으면) 0행이다. 정상이다.

재실행 뒤 **타입을 다시 뽑아야 한다.** 지금 `src/types/database.ts` 에는
지워진 `device_pepper` · `get_my_submissions` 와 옛 `submit_feedback` 시그니처가
그대로 남아 있다 (생성물이라 손으로 고치지 않는다).

```bash
npm run gen:types && npm run typecheck
```

10단계(제출 폼)에서 `submit_feedback` 을 부르기 전까지는 타입이 낡아도
빌드가 깨지지 않지만, 그전에 맞춰두는 편이 낫다.

### 4-2. 7~15단계

관리자 조회는 `lib/auth/dal.ts`, 참여자 조회는 `lib/data/` 를 거친다.
페이지에서 직접 Supabase 를 부르지 않는다.

| 단계 | 내용 |
|---|---|
| 14 | 모바일 QA → 태블릿 |
| 15 | README + Vercel 배포 |

> 집계 화면은 게이트가 잠긴 상태에서만 확인했다 (지금 DB 는 2명 미달).
> 열린 뒤의 화면은 가짜 데이터로 그려서 확인했다. 실제 데이터로는 14단계에서 본다.

각 단계 끝에 리뷰 2회 → 커밋 → 푸시.

> 부록 A 의 강점 설명문에 들어 있는 `함께` 는 **고치지 않는다.** 명세가 원문 그대로 쓰라고 못박았다.

---

## 5. 외부 설정 체크리스트 (코드가 아니라 대시보드에서 할 일)

### Supabase

- [x] `supabase/schema.sql` 실행
- [ ] **스키마 재실행 (필수)** — 트리거 + 5% 눈금 + 기기 식별 제거 + 숨김/삭제.
      채워 넣을 값은 없다. 자세한 내용과 확인 쿼리는 4-1 참고
- [ ] 재실행 뒤 `npm run gen:types` — `hidden_at` 이 생성 타입에 들어가야
      `lib/auth/dal.ts` 의 `overrideTypes` 를 지울 수 있다
- [ ] Authentication → Providers → **Email** 켜기, Google 은 끈 채로 둔다
- [ ] Authentication → Providers → Email → **Confirm email** 켜져 있는지 확인
- [ ] Authentication → **Secure email change** 켜져 있는지 확인
- [ ] Authentication → **Users → Add user** 로 관리자 계정을 미리 만든다
      (`shouldCreateUser: false` 이므로 계정이 없으면 코드를 받을 수 없다)
      ⚠ `admin_allowlist` 에 이메일이 있는 것과 **별개다.** 둘 다 있어야 로그인된다
- [ ] Authentication → Emails → Templates → **Magic Link** 에
      `supabase/emails/otp-code.html` 붙여넣기 (제목: 강점 남기기 로그인 번호).
      `{{ .Token }}` 이 있어야 6자리 번호가 나간다. 자세한 내용은 그 폴더의 README
- [ ] Authentication → URL Configuration → Site URL 과 Redirect URLs
      (`http://localhost:3000/**`, 배포 후 Vercel 주소와 프리뷰 주소)

### Resend (메일 발송)

- [ ] resend.com 가입 → API 키 발급
- [ ] Supabase → Authentication → **SMTP Settings** 에 입력
      - Host `smtp.resend.com` / Port `465` / User `resend` / Password = API 키
      - Sender email 은 Resend 에서 인증한 도메인 주소
- [ ] 도메인이 없으면 Resend 의 테스트 발신 주소로 시작해도 된다

### Vercel

- [x] 저장소 연결
- [ ] **환경변수 등록** — 없으면 빌드가 실패한다.
      `src/lib/supabase/env.ts` 가 모듈 평가 시점에 던지기 때문에
      `Failed to collect page data for /` 로 나타난다

      | 키 | 값 | 필요한 환경 |
      |---|---|---|
      | `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` 과 같은 값 | Production · Preview · Development |
      | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` 과 같은 값 | Production · Preview · Development |

      `SUPABASE_PROJECT_ID` 는 **Vercel 에 넣지 않아도 된다.** 로컬 타입 생성에만 쓴다
- [ ] 배포 후 Supabase → Authentication → URL Configuration 에 실제 주소와
      프리뷰 주소(`https://*-<계정>.vercel.app/**`) 추가

---

## 6. 아직 정하지 않은 것

- [ ] **홈 화면의 앱 이름과 안내 문구.** 지금은 "강점 남기기" 라는 임시 문구다
- [ ] **파비콘과 OG 이미지** — 6-1 은 덕목 6색 띠를 쓰라고 한다. 만들 시점 미정
- [ ] 실제 사용 일정 — 언제 쓰는 모임인지에 따라 14단계 QA 범위가 달라진다

---

## 7. 참고

- `supabase/schema.sql` 에 채워 넣을 비밀값은 없다. 붙여넣고 그대로 실행하면 된다
- `src/types/database.ts` 는 생성물이다. 손으로 고치지 말고 `npm run gen:types` 를 쓴다
- 관리자 화면의 조회는 전부 `lib/auth/dal.ts` 를 거친다. 페이지에서 Supabase 를 직접 부르지 않는다
- Server Action 은 첫 줄에서 권한을 확인하되 던지지 말고 `ActionResult` 로 돌려준다
- `SUPABASE_SERVICE_ROLE_KEY` 는 이 앱에서 쓰지 않는다. `lib/supabase/admin.ts` 를 만들지 말 것
