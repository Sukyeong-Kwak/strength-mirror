"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { completeAdminLogin } from "@/actions/admin/login";
import { Button } from "@/components/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginPanelProps = {
  /** 로그인 후 돌아갈 경로 */
  next: string;
  /** 로그아웃 라우트에서 넘어온 오류 */
  initialError: string | null;
};

type Stage = "email" | "code";

const OTP_LENGTH = 6;

/**
 * 코드를 보낸 뒤의 안내는 성공·실패를 구분하지 않는다.
 *
 * 구분하면 "이 주소가 관리자인가" 를 알려주는 신호가 된다.
 * 계정은 대시보드에서 미리 만들어 두므로(shouldCreateUser: false),
 * 등록되지 않은 주소로는 애초에 코드가 가지 않는다.
 */
const CODE_SENT_NOTICE = `메일로 ${OTP_LENGTH}자리 코드를 보냈어요. 받은 편지함을 확인해주세요`;

export function LoginPanel({ next, initialError }: LoginPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");

  async function sendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("이메일 주소를 정확히 입력해주세요");
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    try {
      await supabase.auth.signInWithOtp({
        email: trimmed,
        // 계정은 대시보드에서 미리 만든다.
        // 아무나 코드를 요청해 메일 할당량을 소진시키는 것을 막는다
        options: { shouldCreateUser: false },
      });
    } catch {
      // 통신이 끊기면 supabase-js 가 예외를 그대로 던진다.
      // 여기서 받지 않으면 busy 가 true 로 남아 버튼이 영영 잠긴다.
      // 어차피 결과를 구분하지 않으므로 성공과 같은 화면으로 넘어간다
    }

    setBusy(false);
    setSentTo(trimmed);
    setStage("code");
  }

  async function verifyCode() {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== OTP_LENGTH) {
      setError(`코드 ${OTP_LENGTH}자리를 입력해주세요`);
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    // 통신이 끊기면 supabase-js 도 Server Action 도 예외를 그대로 던진다.
    // 이벤트 핸들러의 예외는 에러 바운더리가 잡지 않으므로 여기서 받는다.
    // 받지 않으면 busy 가 true 로 남아 버튼이 영영 잠긴다
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: sentTo,
        token: trimmedCode,
        type: "email",
      });

      if (verifyError) {
        setBusy(false);
        setError("코드가 맞지 않아요. 다시 확인해주세요");
        return;
      }

      // 로그인은 "이 주소의 주인이다" 까지만 보장한다.
      // 관리자인지는 서버가 판단하고, 아니면 서버가 세션을 끊는다
      const result = await completeAdminLogin();
      if (!result.ok) {
        // 서버가 이미 끊었지만 브라우저에 남은 상태도 정리한다
        await supabase.auth.signOut().catch(() => undefined);
        setBusy(false);
        setStage("email");
        setCode("");
        setError(result.error);
        return;
      }
    } catch {
      setBusy(false);
      setError("연결이 끊겼어요. 잠시 뒤 다시 눌러주세요");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {stage === "email" && (
        <form
          className="space-y-3 rounded-base border border-line bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
        >
          <label className="block text-sm text-muted" htmlFor="admin-email">
            이메일
          </label>
          <input
            id="admin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-11 w-full rounded-base border border-line px-3 text-base"
          />
          <Button block size="lg" type="submit" disabled={busy}>
            코드 받기
          </Button>
        </form>
      )}

      {stage === "code" && (
        <>
          <div className="rounded-base border border-line bg-surface px-4 py-3">
            <p className="text-sm text-muted">{CODE_SENT_NOTICE}</p>
            <p className="mt-1 text-sm">{sentTo}</p>
          </div>

          <form
            className="space-y-3 rounded-base border border-line bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
          >
            <label className="block text-sm text-muted" htmlFor="admin-code">
              받은 코드 {OTP_LENGTH}자리
            </label>
            <input
              id="admin-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              autoFocus
              value={code}
              disabled={busy}
              onChange={(event) => setCode(event.target.value)}
              className="num min-h-11 w-full rounded-base border border-line px-3 text-base tracking-widest"
            />
            <Button block size="lg" type="submit" disabled={busy}>
              로그인
            </Button>
          </form>

          <Button
            block
            size="sm"
            variant="quiet"
            disabled={busy}
            onClick={() => {
              setStage("email");
              setCode("");
              setError(null);
            }}
          >
            다른 주소로 받기
          </Button>
        </>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}
