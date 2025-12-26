"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Form, Input, Message, Panel, useToaster } from "rsuite";
import { authApi } from "@/lib/api";
import Footer from "../components/Footer";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toaster = useToaster();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Read token from the URL query string (useSearchParams can cause
    // prerendering issues in some Next builds, so use the standard API here)
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (!tokenParam) {
      toaster.push(
        <Message showIcon type="error">
          Neplatný odkaz na reset hesla
        </Message>,
        { placement: "topEnd" },
      );
      router.push("/forgot_password");
      return;
    }

    setToken(tokenParam);

    // Validovať token cez API
    authApi
      .validateResetToken(tokenParam)
      .then((response) => {
        setIsValidToken(response.valid);
        if (!response.valid) {
          toaster.push(
            <Message showIcon type="error">
              {response.message || "Neplatný alebo expirovaný token"}
            </Message>,
            { placement: "topEnd" },
          );
        }
      })
      .catch(() => {
        setIsValidToken(false);
        toaster.push(
          <Message showIcon type="error">
            Chyba pri validácii tokenu
          </Message>,
          { placement: "topEnd" },
        );
      });
  }, [router, toaster]);

  const handleSubmit = async () => {
    if (!formData.password || !formData.confirmPassword) {
      toaster.push(
        <Message showIcon type="warning">
          Vyplňte všetky polia
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    if (formData.password.length < 8) {
      toaster.push(
        <Message showIcon type="warning">
          Heslo musí mať aspoň 8 znakov
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toaster.push(
        <Message showIcon type="warning">
          Heslá sa nezhodujú
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    if (!token) {
      toaster.push(
        <Message showIcon type="error">
          Neplatný token
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, formData.password);

      toaster.push(
        <Message showIcon type="success">
          Heslo bolo úspešne zmenené
        </Message>,
        { placement: "topEnd" },
      );

      // Presmerovanie na login po úspešnom resete
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Nastala chyba pri zmene hesla. Skúste to znova.";
      toaster.push(
        <Message showIcon type="error">
          {errorMessage}
        </Message>,
        { placement: "topEnd" },
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="auth-container">
        <Panel bordered className="auth-panel">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <Message type="info" showIcon>
              Overujem odkaz...
            </Message>
          </div>
        </Panel>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="auth-container">
        <Panel bordered className="auth-panel">
          <div className="auth-header">
            <h2 className="auth-title">Neplatný odkaz</h2>
            <p className="auth-subtitle">
              Odkaz na reset hesla je neplatný alebo expirovaný
            </p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Message type="error" showIcon>
              Požiadajte o nový odkaz na reset hesla
            </Message>
          </div>
          <Button
            appearance="primary"
            color="red"
            block
            size="lg"
            onClick={() => router.push("/forgot-password")}
          >
            Požiadať o nový odkaz
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <>
      <div className="auth-container">
        <Panel bordered className="auth-panel">
          <div className="auth-header">
            <div
              className="dashboard-logo"
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <Image
                src="/logo 155.png"
                alt="CallTrainer Logo"
                width={100}
                height={100}
                style={{ objectFit: "contain" }}
              />
            </div>
            <h2 className="auth-title">Nové heslo</h2>
            <p className="auth-subtitle">Zadajte svoje nové heslo</p>
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
              <Form.ControlLabel>Nové heslo</Form.ControlLabel>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value) =>
                  setFormData({ ...formData, password: value })
                }
                disabled={isLoading}
              />
              <Form.HelpText>Heslo musí mať aspoň 8 znakov</Form.HelpText>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Potvrďte nové heslo</Form.ControlLabel>
              <Input
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(value) =>
                  setFormData({ ...formData, confirmPassword: value })
                }
                disabled={isLoading}
              />
            </Form.Group>
            <Button
              appearance="primary"
              color="red"
              block
              size="lg"
              loading={isLoading}
              onClick={handleSubmit}
              className="auth-submit-btn"
            >
              Zmeniť heslo
            </Button>
          </Form>
          <div className="auth-footer">
            <a href="/login" className="auth-footer-link">
              ← Späť na prihlásenie
            </a>
          </div>
        </Panel>
      </div>
      <Footer />
    </>
  );
}
