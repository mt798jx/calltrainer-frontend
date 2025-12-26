"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Message, Panel, useToaster } from "rsuite";
import BackButton from "@/app/(auth)/components/BackButton";
import { authApi } from "@/lib/api";
import Footer from "../../components/Footer";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "Neplatný alebo expirovaný kód";
};

export default function Verify2FAPage() {
  const router = useRouter();
  const toaster = useToaster();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);

  // Pomocná: zloženie kódu
  const code = digits.join("");

  useEffect(() => {
    // Ak nemáme pending email, vráť sa na login
    const email = localStorage.getItem("pending_2fa_email");
    if (!email) {
      router.replace("/login");
    }
  }, [router]);

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 1); // len číslo, 1 znak
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    // auto-focus ďalšie pole
    if (v && index < 5) {
      const el = document.getElementById(
        `otp-${index + 1}`,
      ) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text").trim();
    // Check if the pasted text is a 6-digit number
    if (/^\d{6}$/.test(pastedText)) {
      e.preventDefault();
      setDigits(pastedText.split(""));
      // Focus the last input after paste
      const lastInput = document.getElementById(
        "otp-5",
      ) as HTMLInputElement | null;
      lastInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const email = localStorage.getItem("pending_2fa_email");
    if (!email) {
      toaster.push(
        <Message showIcon type="warning">
          Chýba e‑mail. Prihlás sa znova.
        </Message>,
        { placement: "topEnd" },
      );
      router.replace("/login");
      return;
    }
    if (code.length !== 6) {
      toaster.push(
        <Message showIcon type="warning">
          Zadaj 6‑miestny kód.
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    try {
      // zavolá backend /auth/verify-2fa
      const res = await authApi.verify2fa({ email, code });
      localStorage.removeItem("pending_2fa_email");
      localStorage.setItem("access_token", res.access_token);

      toaster.push(
        <Message showIcon type="success">
          Overenie úspešné.
        </Message>,
        { placement: "topEnd" },
      );

      // zisti rolu a presmeruj
      const me = await authApi.me();
      const isAdmin = me.role === "ADMIN";
      router.push(isAdmin ? "/dashboard" : "/operatorBoard");
    } catch (err: unknown) {
      toaster.push(
        <Message showIcon type="error">
          {getErrorMessage(err)}
        </Message>,
        { placement: "topEnd" },
      );
    }
  };

  const [isResending, setIsResending] = useState(false);
  const handleResend = async () => {
    const email = localStorage.getItem("pending_2fa_email");
    if (!email) {
      toaster.push(
        <Message showIcon type="warning">
          Chýba e‑mail. Prihlás sa znova.
        </Message>,
        { placement: "topEnd" },
      );
      router.replace("/login");
      return;
    }

    try {
      setIsResending(true);
      await authApi.resend2fa(email);
      toaster.push(
        <Message showIcon type="success">
          Kód bol znovu odoslaný na e‑mail.
        </Message>,
        { placement: "topEnd" },
      );
    } catch (err: unknown) {
      toaster.push(
        <Message showIcon type="error">
          {getErrorMessage(err)}
        </Message>,
        { placement: "topEnd" },
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <Panel bordered className="auth-panel">
          <BackButton href="/login" title="Späť na prihlásenie" />
          <div className="auth-header">
            <h2 className="auth-title">Overenie kódu</h2>
            <p className="auth-subtitle">
              Zadajte 6‑miestny kód, ktorý sme poslali na e‑mail.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              margin: "24px 0",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={1}
                value={digits[i]}
                onChange={(e) => setDigit(i, e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) {
                    const prev = document.getElementById(
                      `otp-${i - 1}`,
                    ) as HTMLInputElement | null;
                    prev?.focus();
                  }
                }}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: "center",
                  fontSize: 24,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            ))}
          </div>

          <Button
            appearance="primary"
            color="red"
            block
            size="lg"
            onClick={handleSubmit}
          >
            Overiť kód
          </Button>

          <div
            style={{
              marginTop: 24,
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="link-button"
              style={{ fontSize: "14px" }}
            >
              {isResending ? "Odosielam..." : "Poslať kód znova"}
            </button>
          </div>
        </Panel>
      </div>
      <Footer />
    </>
  );
}
