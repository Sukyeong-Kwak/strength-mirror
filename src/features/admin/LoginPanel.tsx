"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { completeAdminLogin } from "@/actions/admin/login";
import { Button } from "@/components/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginPanelProps = {
  /** 로그인 후 돌아갈 경로 */
  next: string;
  /** 콜백에서 넘어온 오류 */
  initialError: string | null;
};

type OtpStage = "idle" | "sent";

const OTP_LENGTH = 6;

export function LoginPanel({ next, initialError }: LoginPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [stage, setStage] = useState<OtpStage>("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/admin/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (oauthError) {
      setBusy(false);
      setError("구글 로그인을 시작하지 못했어요. 잠시 뒤 다시 눌러주세요");
    }
  }

  async function sendCode() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("이메일 주소를 정확히 입력해주세요");
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setBusy(false);

    if (otpError) {
      setError("코드를 보내지 못했어요. 주소를 확인하고 다시 눌러주세요");
      return;
    }
    setStage("sent");
  }

  async function verifyCode() {
    if (code.trim().length !== OTP_LENGTH) {
      setError(`코드 ${OTP_LENGTH}자리를 입력해주세요`);
      return;
    }

    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });

    if (verifyError) {
      setBusy(false);
      setError("코드가 맞지 않아요. 다시 확인해주세요");
      return;
    }

    const result = await completeAdminLogin();
    if (!result.ok) {
      await supabase.auth.signOut();
      setBusy(false);
      setStage("idle");
      setCode("");
      setError(result.error);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Button block disabled={busy} onClick={signInWithGoogle}>
        구글로 로그인
      </Button>

      {!showOtp && (
        <button
          type="button"
          className="w-full py-2 text-sm text-muted underline underline-offset-4"
          onClick={() => {
            setShowOtp(true);
            setError(null);
          }}
        >
          이메일로 코드 받기
        </button>
      )}

      {showOtp && (
        <div className="space-y-3 rounded-base border border-line bg-surface p-4">
          <label className="block text-sm text-muted" htmlFor="admin-email">
            이메일
          </label>
          <input
            id="admin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={busy || stage === "sent"}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-11 w-full rounded-base border border-line px-3 text-base"
          />

          {stage === "idle" && (
            <Button block variant="secondary" disabled={busy} onClick={sendCode}>
              코드 받기
            </Button>
          )}

          {stage === "sent" && (
            <>
              <label className="block text-sm text-muted" htmlFor="admin-code">
                메일로 받은 {OTP_LENGTH}자리 코드
              </label>
              <input
                id="admin-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={code}
                disabled={busy}
                onChange={(event) => setCode(event.target.value)}
                className="num min-h-11 w-full rounded-base border border-line px-3 text-base tracking-widest"
              />
              <Button block disabled={busy} onClick={verifyCode}>
                로그인
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm text-muted underline underline-offset-4"
                disabled={busy}
                onClick={() => {
                  setStage("idle");
                  setCode("");
                  setError(null);
                }}
              >
                주소 바꾸기
              </button>
            </>
          )}
        </div>
      )}

      {error !== null && (
        <p
          role="alert"
          className="rounded-base border border-line bg-surface px-4 py-3 text-sm text-virtue-courage"
        >
          {error}
        </p>
      )}
    </div>
  );
}
