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

`.env.local` 에 채울 값 4개 (저장소에 없다):

| 키 | 어디서 얻나 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 화면의 anon / public 키 |
| `SUPABASE_PROJECT_ID` | Project Settings → General → Reference ID |
| `DEVICE_ID_PEPPER` | **이미 DB 에 들어 있다.** SQL Editor 에서 `select public.device_pepper();` 로 꺼내 그대로 붙여넣는다 |

> `DEVICE_ID_PEPPER` 를 새로 만들면 안 된다. 값이 바뀌면 이미 쌓인 `client_hash` 와 매칭되지 않아 기존 제출 이력이 전부 다른 기기로 인식된다.

그다음:

```bash
npx supabase login      # 타입 생성에 필요. 브라우저가 열린다
npm run gen:types       # src/types/database.ts 재생성
npm run typecheck && npm test && npm run build
npm run dev
```

확인용 명령:

```bash
npm test          # Vitest 57개
npm run typecheck # tsc --noEmit
npm run lint
```

---

## 2. 확정된 결정

명세와 달라진 부분과, 물어보고 정한 것들. **다시 논의하지 말 것.**

| 항목 | 결정 | 이유 |
|---|---|---|
| Tailwind | v4 (`@theme` 블록이 설정 위치, `tailwind.config.ts` 없음) | create-next-app 기본값 |
| 폰트 | Pretendard 가변 woff2 self-host + 고운바탕 `next/font/google` | 외부 CDN 의존 제거 |
| 테스트 | Vitest만 추가 (Testing Library 미사용) | 순수 함수만 테스트 |
| 5-4 최다 수신자 표시 | **구현하지 않음** | "특정 인물이 몇 개 받았는지 알 수 없게" 원칙과 충돌 |
| device pepper | DB 설정값(`current_setting`) 대신 `app_config` 테이블 + `device_pepper()` 접근자 | Supabase 의 postgres 롤은 슈퍼유저가 아니라 커스텀 GUC 를 못 만든다 |
| 강점 비율 뷰 | 덕목 뷰와 같은 최대잔여법 (합계 정확히 100) | 각자 반올림하면 합이 96~108 로 흩어져 덕목별 보기 소계가 어긋난다 |
| 사유 목록 게이트 | `feedback_reasons_public` 에도 공개 게이트 적용 | 사유 카드 수를 세면 그 사람이 받은 강점 수가 된다 |
| 관리자 로그인 | **이메일 인증번호(OTP)만.** Google OAuth 는 쓰지 않는다 | 설정 단계를 줄인다 |
| OTP 계정 생성 | `shouldCreateUser: false`. 계정은 Supabase 대시보드에서 미리 만든다 | 아무나 코드를 요청해 메일 할당량을 소진시키는 것을 막는다 |
| 메일 발송 | Resend 커스텀 SMTP | Supabase 기본 SMTP 는 시간당 발송 제한이 매우 낮다 |

---

## 3. 진행 상황

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 셋업 (Next 16, TS strict, 덕목 색·서체) | 완료 |
| 2 | DB 스키마 (테이블 7 · 뷰 11 · RPC 2 · RLS) | 완료 · **적용됨** |
| 3 | 타입 생성 + Supabase 클라이언트 | 완료 |
| 4 | 관리자 인증 | 코드 완료 · **리뷰 지적 미반영** · 로그인 방식 변경 필요 |
| 5 | 명단 파서 `parsePeople.ts` | 완료 (테스트 27) |
| 6 | 명단 일괄 등록 화면 `/admin/people/import` | 미착수 |
| 7 | 클라이언트 ID (`clientId.ts`, `get_my_submissions`) | 미착수 |
| 8 | 홈 (조 필터·검색·사람 목록) | 미착수 |
| 9 | 조 참여 흐름 (내 조, 진행 카드) | 미착수 |
| 10 | 강점 등록 폼 (3단계 + 확인 다이얼로그) | 미착수 |
| 11 | 차트 컴포넌트 (`RatioBar` 등) | `ratio.ts` + 테스트만 완료 |
| 12 | 개인 결과 페이지 | 미착수 |
| 13 | 전체 통계 페이지 | 미착수 |
| 13-1 | 중복 점검 `/admin/duplicates` | 미착수 |
| 14 | 모바일 QA → 태블릿 확장 | 미착수 |
| 15 | README + Vercel 배포 | 미착수 |

이미 만든 순수 함수 라이브러리: `groups.ts`(14) · `ratio.ts`(16) · `parsePeople.ts`(27) — 테스트 57개 통과.

---

## 4. 다음에 할 일 — 우선순위 순

### 4-1. 로그인 방식을 OTP 전용으로 바꾸기 (먼저)

- [ ] `src/features/admin/LoginPanel.tsx` — 구글 버튼 제거, OTP 를 주 동선으로. `shouldCreateUser: false`
- [ ] 코드 요청 결과 메시지를 **성공·실패 모두 동일하게** 할 것. 다르면 "이 주소가 관리자인지" 알려주는 신호가 된다
- [ ] `src/app/admin/auth/callback/route.ts` — OAuth 콜백 삭제. 대신 `/admin/auth/signout` 라우트를 만든다 (아래 참고)
- [ ] `.env.example` 의 Google OAuth 안내 문단을 Resend SMTP 안내로 교체
- [ ] Supabase 대시보드 작업 (5장 참고)

### 4-2. 보안 리뷰 지적 반영

- [x] 마지막 관리자 보호를 DB 트리거로 (`prevent_last_admin_delete`) — **스키마 재실행 필요**
- [ ] 허용목록에 없는 계정을 **서버에서** 로그아웃시킬 것. 지금은 클라이언트가 무시하면 세션이 살아 있다
      - `src/actions/admin/login.ts` — 거부 시 `supabase.auth.signOut()` 호출
      - `/admin/auth/signout` 라우트 핸들러를 만들고, 관리자 페이지의 리다이렉트를 그쪽으로 보낸다
- [ ] `removeAdmin` 이 삭제된 행 수를 확인하지 않는다. `.delete().eq().select()` 로 바꿀 것
- [ ] `src/app/admin/` 을 라우트 그룹 `(protected)` 으로 옮기고 그 레이아웃에서 권한을 확인할 것.
      지금은 페이지마다 손으로 확인하고 있어서 새 페이지를 추가할 때 빠뜨리기 쉽다
- [ ] `src/app/page.tsx` — Postgres 오류 원문을 화면에 그대로 찍고 있다. 일반 문구로 교체
- [ ] Supabase 대시보드에서 **Confirm email** 과 **Secure email change** 가 켜져 있는지 확인.
      꺼져 있으면 이메일을 관리자 주소로 바꿔 권한을 가로챌 수 있다

### 4-3. 정확성 리뷰 지적 반영

- [ ] **에러 바운더리가 하나도 없다.** `assertAdmin()` 이 던지면 관리자 화면 전체가 Next 기본 에러 페이지로 바뀐다
      - `manageAdmins.ts` 가 throw 대신 `ActionResult` 를 돌려주도록
      - `AdminAllowlist.tsx` 의 `startTransition` 안에 try/catch
      - `src/app/error.tsx` 추가
- [ ] Supabase 조회 오류를 삼키고 있다 (`?? []`). 특히 `/admin/settings` 는 조회 실패 시
      빈 목록 + "마지막 관리자는 제거할 수 없어요" 라는 정반대 화면이 나온다
- [ ] `font-display`(고운바탕)를 사람 이름·강점 이름에만 쓸 것.
      지금 `AdminShell` 제목, 로그인 h1, 홈 h1 에 잘못 쓰였다
- [ ] 터치 타겟 44px 미만 2곳 — `LoginPanel.tsx` 의 "이메일로 코드 받기", "주소 바꾸기"
- [ ] `~습니다` 두 곳을 `~해요` 로 (`AdminAllowlist.tsx` 추가·제거 알림)
- [ ] `AdminAllowlist.tsx` 의 상대 시간이 클라이언트 컴포넌트에서 계산돼 하이드레이션 불일치 위험.
      서버에서 문자열로 만들어 넘길 것
- [ ] `person_totals_internal` 조회에 `.order()` 가 없어 행 순서가 매번 바뀔 수 있다
- [ ] `group_name` 이 빈 문자열일 때 `미지정` 으로 안 바뀐다. `toGroupLabel()` 을 쓸 것
- [ ] 숫자에 `.num`(tabular figures) 누락 2곳
- [ ] "돌아가기" 버튼이 실제로는 취소 동작이다. 라벨을 동작과 맞출 것
- [ ] `ReceiptStatusTable` 빈 상태가 "결과 없음" 뿐. 다음 행동을 지시할 것
- [ ] `src/middleware.ts` → `src/proxy.ts`, `export function proxy` (Next 16에서 이름 변경)
- [ ] `text-white` → `text-surface` (선언한 토큰만 쓰기)
- [ ] 입력 필드를 `<form>` 으로 감싸 Enter 로 제출되게
- [ ] 표에 `min-w-max` 가 없어 `overflow-x-auto` 가 동작하지 않는다
- [ ] 구현 용어가 문구에 노출 — "재배포 없이", "다음 요청부터"
- [ ] `src/app/layout.tsx` metadata description 이 금지어(`함께`)와 `~습니다` 를 쓴다
- [ ] `PersonTotals.createdBy` 를 아무 데도 안 쓴다. 수신 현황 표에 `등록: 수경` 열로 넣을 것

> 부록 A 의 강점 설명문에 들어 있는 `함께` 는 **고치지 않는다.** 명세가 원문 그대로 쓰라고 못박았다.

### 4-4. 그다음 단계 (6~15)

명세의 구현 순서를 그대로 따른다. 각 단계 끝에 리뷰 2회 → 커밋 → 푸시.

---

## 5. 외부 설정 체크리스트 (코드가 아니라 대시보드에서 할 일)

### Supabase

- [x] `supabase/schema.sql` 실행
- [ ] **스키마 재실행** — 마지막 관리자 보호 트리거가 추가됐다.
      실행 전에 `PASTE_DEVICE_ID_PEPPER_HERE` 를 실제 값으로 바꿀 것.
      이미 값이 있으면 덮어쓰지 않으므로 재실행은 안전하다
- [ ] Authentication → Providers → **Email** 켜기, Google 은 끈 채로 둔다
- [ ] Authentication → Providers → Email → **Confirm email** 켜져 있는지 확인
- [ ] Authentication → **Secure email change** 켜져 있는지 확인
- [ ] Authentication → **Users → Add user** 로 관리자 계정을 미리 만든다
      (`shouldCreateUser: false` 이므로 계정이 없으면 코드를 받을 수 없다)
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

      `DEVICE_ID_PEPPER` 와 `SUPABASE_PROJECT_ID` 는 **Vercel 에 넣지 않아도 된다.**
      해싱은 DB 안에서 하고, project id 는 로컬 타입 생성에만 쓴다
- [ ] 배포 후 Supabase → Authentication → URL Configuration 에 실제 주소와
      프리뷰 주소(`https://*-<계정>.vercel.app/**`) 추가

---

## 6. 아직 정하지 않은 것

- [ ] **홈 화면의 앱 이름과 안내 문구.** 지금은 "강점 남기기" 라는 임시 문구다
- [ ] **파비콘과 OG 이미지** — 6-1 은 덕목 6색 띠를 쓰라고 한다. 만들 시점 미정
- [ ] **`/admin/duplicates` 의 기기 라벨 표기** — `기기 A` / `기기 B` 를 어떤 순서로 매길지
      (제출 시각 순으로 하면 될 듯하나 확정 필요)
- [ ] 실제 사용 일정 — 언제 쓰는 모임인지에 따라 14단계 QA 범위가 달라진다

---

## 7. 참고

- 저장소에 **실제 pepper 나 키를 커밋하지 말 것.** `supabase/schema.sql` 의 pepper 는 항상 자리표시자로 둔다
- `src/types/database.ts` 는 생성물이다. 손으로 고치지 말고 `npm run gen:types` 를 쓴다
- 관리자 Server Action 은 전부 첫 줄에서 `assertAdmin()` 을 부른다
- `SUPABASE_SERVICE_ROLE_KEY` 는 이 앱에서 쓰지 않는다. `lib/supabase/admin.ts` 를 만들지 말 것
