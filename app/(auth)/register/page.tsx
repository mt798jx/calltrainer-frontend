"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Panel,
  SelectPicker,
  useToaster,
} from "rsuite";
import { useRegister } from "@/hooks/useAuth";
import Footer from "../components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const toaster = useToaster();
  const register = useRegister();
  const kosOptions = [
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO BRATISLAVA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO BRATISLAVA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO TRNAVA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO TRNAVA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO NITRA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO NITRA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO TRENČÍN",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO TRENČÍN",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO BANSKÁ BYSTRICA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO BANSKÁ BYSTRICA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO ŽILINA",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO ŽILINA",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO PREŠOV",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO PREŠOV",
    },
    {
      label: "KRAJSKÉ OPERAČNÉ STREDISKO KOŠICE",
      value: "KRAJSKÉ OPERAČNÉ STREDISKO KOŠICE",
    },
  ];
  const [formValue, setFormValue] = useState({
    email: "",
    first_name: "",
    last_name: "",
    organization: "",
    password: "",
    confirmPassword: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = () => {
    if (
      !formValue.email ||
      !formValue.first_name ||
      !formValue.last_name ||
      !formValue.organization ||
      !formValue.password ||
      !formValue.confirmPassword
    ) {
      toaster.push(
        <Message showIcon type="warning">
          Vyplňte všetky polia
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    if (formValue.password !== formValue.confirmPassword) {
      toaster.push(
        <Message showIcon type="error">
          Heslá sa nezhodujú
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    if (formValue.password.length < 6) {
      toaster.push(
        <Message showIcon type="warning">
          Heslo musí mať aspoň 6 znakov
        </Message>,
        { placement: "topEnd" },
      );
      return;
    }

    register.mutate(
      {
        email: formValue.email,
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        organization: formValue.organization,
        password: formValue.password,
      },
      {
        onSuccess: () => {
          setShowSuccessModal(true);
        },
        onError: (error: Error) => {
          toaster.push(
            <Message showIcon type="error">
              {error.message}
            </Message>,
            { placement: "topEnd" },
          );
        },
      },
    );
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push("/login");
  };

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
            <h2 className="auth-title">Registrácia</h2>
            <p className="auth-subtitle">
              Vytvorte si účet pre prístup do CallTrainer
            </p>
          </div>

          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>Meno</Form.ControlLabel>
              <Input
                name="first_name"
                placeholder="Ján"
                value={formValue.first_name}
                onChange={(value) =>
                  setFormValue({ ...formValue, first_name: value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Priezvisko</Form.ControlLabel>
              <Input
                name="last_name"
                placeholder="Novák"
                value={formValue.last_name}
                onChange={(value) =>
                  setFormValue({ ...formValue, last_name: value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Email</Form.ControlLabel>
              <Input
                name="email"
                type="email"
                placeholder="vas.email@zdravotnictvo.sk"
                value={formValue.email}
                onChange={(value) =>
                  setFormValue({ ...formValue, email: value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Organizácia</Form.ControlLabel>
              <SelectPicker
                data={kosOptions}
                placeholder="Vyberte KOS"
                block
                value={formValue.organization || undefined}
                onChange={(value) =>
                  setFormValue({ ...formValue, organization: value || "" })
                }
                cleanable={false}
                searchable={false}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Heslo</Form.ControlLabel>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formValue.password}
                onChange={(value) =>
                  setFormValue({ ...formValue, password: value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>Potvrdiť heslo</Form.ControlLabel>
              <Input
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formValue.confirmPassword}
                onChange={(value) =>
                  setFormValue({ ...formValue, confirmPassword: value })
                }
              />
            </Form.Group>

            <Button
              appearance="primary"
              color="red"
              block
              size="lg"
              loading={register.isPending}
              onClick={handleSubmit}
              className="auth-submit-btn"
            >
              Zaregistrovať sa
            </Button>
          </Form>

          <div className="auth-footer">
            <span className="auth-footer-text">Už máte účet? </span>
            <a href="/login" className="auth-footer-link">
              Prihláste sa
            </a>
          </div>
        </Panel>
      </div>

      <Footer />

      <Modal open={showSuccessModal} onClose={handleModalClose} size="xs">
        <Modal.Header>
          <Modal.Title>Registrácia úspešná!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="success-modal-content">
            <div className="success-modal-icon">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                aria-label="Success icon"
              >
                <title>Success icon</title>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <p className="success-modal-text">
              Váš účet čaká na schválenie administrátorom.
            </p>
            <p className="success-modal-subtext">
              Dostanete notifikáciu emailom po schválení.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleModalClose} appearance="primary" color="red">
            Rozumiem
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
