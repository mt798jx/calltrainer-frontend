"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Form, Input, Message, Panel, useToaster } from "rsuite";
import { authApi } from "@/lib/api";
import Footer from "../components/Footer";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toaster = useToaster();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toaster.push(
        <Message showIcon type="warning">
          Zadajte svoj email
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    // Validácia emailu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toaster.push(
        <Message showIcon type="warning">
          Zadajte platný email
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.requestPasswordReset(email);

      setIsEmailSent(true);

      toaster.push(
        <Message showIcon type="success">
          Ak existuje účet s týmto emailom, poslali sme vám odkaz na reset hesla
        </Message>,
        { placement: "topEnd" },
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Nastala chyba pri posielaní emailu. Skúste to znova.";
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

  if (isEmailSent) {
    return (
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
            <h2 className="auth-title">Email odoslaný</h2>
            <p className="auth-subtitle">
              Skontrolujte svoj email a kliknite na odkaz na reset hesla
            </p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Message type="info" showIcon>
              Ak nevidíte email, skontrolujte aj spam priečinok. Odkaz je platný
              24 hodín.
            </Message>
          </div>
          <div className="auth-footer">
            <Button
              appearance="ghost"
              block
              size="lg"
              onClick={() => router.push("/login")}
            >
              Späť na prihlásenie
            </Button>
            <div
              className="auth-footer-secondary"
              style={{ marginTop: "1rem" }}
            >
              <span className="auth-footer-text">Nedostali ste email? </span>
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => {
                  handleSubmit();
                }}
              >
                Skúsiť znova
              </button>
            </div>
          </div>
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
            <h2 className="auth-title">Zabudnuté heslo</h2>
            <p className="auth-subtitle">
              Zadajte svoj email a pošleme vám odkaz na reset hesla
            </p>
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
                placeholder="vás@email.sk"
                value={email}
                onChange={(value) => setEmail(value)}
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
              Poslať odkaz na reset
            </Button>
          </Form>
          <div className="auth-footer">
            <a href="/login" className="auth-footer-link">
              ← Späť na prihlásenie
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
