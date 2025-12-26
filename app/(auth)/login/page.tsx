"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Form, Input, Message, Panel, useToaster } from "rsuite";
import { useLogin } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import type { LoginResponse, TwoFactorRequiredResponse } from "@/types";
import Footer from "../components/Footer";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTwoFactorRequiredResponse = (
  payload: unknown,
): payload is TwoFactorRequiredResponse =>
  isRecord(payload) && payload.detail === "2fa_required";

const isLoginResponsePayload = (payload: unknown): payload is LoginResponse =>
  isRecord(payload) && typeof payload.access_token === "string";

export default function LoginPage() {
  const router = useRouter();
  const toaster = useToaster();
  const login = useLogin();
  const [formValue, setFormValue] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!formValue.email || !formValue.password) {
      toaster.push(
        <Message showIcon type="warning">
          Vyplňte všetky polia
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    login.mutate(
      {
        email: formValue.email,
        password: formValue.password,
      },
      {
        onSuccess: async (data) => {
          if (isTwoFactorRequiredResponse(data)) {
            // uložíme email pre verifikáciu
            localStorage.setItem("pending_2fa_email", formValue.email);
            // presmeruj na zadanie kódu
            router.push("/login/verify-2fa");
            return;
          }

          if (!isLoginResponsePayload(data)) {
            toaster.push(
              <Message showIcon type="error">
                Neznámy formát odpovede servera.
              </Message>,
              { placement: "topEnd" },
            );
            return;
          }

          const token = data.access_token;
          if (!token) {
            toaster.push(
              <Message showIcon type="error">
                Chýba prístupový token z odpovede servera.
              </Message>,
              { placement: "topEnd" },
            );
            return;
          }

          // Ulož token
          localStorage.setItem("access_token", token);

          toaster.push(
            <Message showIcon type="success">
              Úspešne prihlásený!
            </Message>,
            { placement: "topEnd" },
          );

          // Zisti rolu používateľa cez /me endpoint
          try {
            const user = await authApi.me();

            // Presmerovanie podľa role
            const isAdmin =
              user.email?.includes("ADMIN") || user.role === "ADMIN";

            if (isAdmin) {
              router.push("/dashboard");
            } else {
              router.push("/operatorBoard");
            }
          } catch (error) {
            console.error("Chyba pri načítaní údajov používateľa:", error);
            // Fallback - skús prejsť na dashboard
            router.push("/dashboard");
          }
        },
        onError: (error: Error) => {
          // Detectuj či je to network error alebo server nie je dostupný
          const errorMsg = error.message.toLowerCase();
          const isNetworkError =
            errorMsg.includes("failed to fetch") ||
            errorMsg.includes("network") ||
            errorMsg.includes("connection") ||
            errorMsg.includes("unreachable") ||
            errorMsg.includes("timeout");

          if (isNetworkError) {
            toaster.push(
              <Message showIcon type="error">
                Nie je možné pripojiť sa na server. Skúte prihlásenie neskôr.
              </Message>,
              { placement: "topEnd" },
            );
          } else {
            toaster.push(
              <Message showIcon type="error">
                {error.message}
              </Message>,
              { placement: "topEnd" },
            );
          }
        },
      },
    );
  };

  return (
    <>
      <div className="auth-container">
        <Panel bordered className="auth-panel">
          <div className="auth-header">
            <div
              className="dashboard-logo-text"
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Image
                src="/Nadpis CallTrainer.png"
                alt="CallTrainer Logo"
                width={320}
                height={320}
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <Form
            fluid
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          >
            <Form.Group>
              <Form.ControlLabel>Email</Form.ControlLabel>
              <Input
                name="email"
                type="email"
                placeholder="admin@admin.sk"
                value={formValue.email}
                onChange={(value) =>
                  setFormValue({ ...formValue, email: value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Heslo</Form.ControlLabel>
              <div className="auth-password-field">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="auth-password-input"
                  value={formValue.password}
                  onChange={(value) =>
                    setFormValue({ ...formValue, password: value })
                  }
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label="Podržte pre zobrazenie hesla"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setShowPassword(true);
                  }}
                  onTouchEnd={() => setShowPassword(false)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="Skryť heslo"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.46 18.46 0 0 1-4.26 5.21" />
                      <path d="M14.12 9.88a3 3 0 0 1 0 4.24" />
                      <path d="M9.88 9.88a3 3 0 0 0 0 4.24" />
                      <line x1="3" x2="21" y1="3" y2="21" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="Zobraziť heslo"
                    >
                      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Form.Group>
            <Button
              appearance="primary"
              color="red"
              block
              size="lg"
              loading={login.isPending}
              onClick={handleSubmit}
              className="auth-submit-btn"
            >
              Prihlásiť sa
            </Button>
          </Form>
          <div className="auth-footer">
            <a href="/forgot_password" className="auth-footer-link">
              Zabudli ste heslo?
            </a>
            <div className="auth-footer-secondary">
              <span className="auth-footer-text">Nemáte účet? </span>
              <a href="/register" className="auth-footer-link">
                Zaregistrujte sa
              </a>
            </div>
          </div>
        </Panel>
      </div>
      <Footer />
    </>
  );
}
