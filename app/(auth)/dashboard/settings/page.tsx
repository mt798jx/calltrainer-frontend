"use client";

import { Bell, Mail, Save, Settings, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { settingsApi } from "@/lib/api";
import Footer from "../../components/Footer";

export default function AdminSettingsPage() {
  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "confirm">(
    "success",
  );
  const [modalMessage, setModalMessage] = useState("");

  // Local state for settings (will be loaded from API)
  const [systemSettings, setSystemSettings] = useState({
    systemName: "",
    supportEmail: "",
    maxSessionDuration: 30,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    weeklyReports: false,
    performanceAlerts: false,
  });

  const [security, setSecurity] = useState({
    minPasswordLength: 8,
    sessionTimeout: 60,
    twoFactorAuth: false,
  });

  const [training, setTraining] = useState({
    minPassingScore: 75,
    scenarioRotation: false,
    autoEvaluation: false,
  });

  const [emailConfig, setEmailConfig] = useState({
    smtpServer: "",
    smtpPort: 587,
    username: "",
    password: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await settingsApi.get();
        if (!mounted || !data) return;
        // map backend structure to local state
        setSystemSettings({
          systemName: data.system?.system_name || "CallTrainer 155",
          supportEmail: data.system?.support_email || "podpora@calltrainer.sk",
          maxSessionDuration: data.system?.max_session_duration || 30,
        });
        setNotifications({
          emailNotifications: !!data.notifications?.email_notifications,
          weeklyReports: !!data.notifications?.weekly_reports,
          performanceAlerts: !!data.notifications?.performance_alerts,
        });
        setSecurity({
          minPasswordLength: data.security?.min_password_length || 8,
          sessionTimeout: data.security?.session_timeout || 60,
          twoFactorAuth: !!data.security?.two_factor_auth,
        });
        setTraining({
          minPassingScore: data.training?.min_passing_score || 75,
          scenarioRotation: !!data.training?.scenario_rotation,
          autoEvaluation: !!data.training?.auto_evaluation,
        });
        setEmailConfig({
          smtpServer: data.email?.smtp_server || "smtp.gmail.com",
          smtpPort: data.email?.smtp_port || 587,
          username: data.email?.username || "",
          password: data.email?.password || "",
        });
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveChanges = () => {
    (async () => {
      const payload = {
        system: {
          system_name: systemSettings.systemName,
          support_email: systemSettings.supportEmail,
          max_session_duration: systemSettings.maxSessionDuration,
        },
        notifications: {
          email_notifications: notifications.emailNotifications,
          weekly_reports: notifications.weeklyReports,
          performance_alerts: notifications.performanceAlerts,
        },
        security: {
          min_password_length: security.minPasswordLength,
          session_timeout: security.sessionTimeout,
          two_factor_auth: security.twoFactorAuth,
        },
        training: {
          min_passing_score: training.minPassingScore,
          scenario_rotation: training.scenarioRotation,
          auto_evaluation: training.autoEvaluation,
        },
        email: {
          smtp_server: emailConfig.smtpServer,
          smtp_port: emailConfig.smtpPort,
          username: emailConfig.username,
          password: emailConfig.password,
        },
      };
      try {
        await settingsApi.update(payload);
        setModalType("success");
        setModalMessage("Nastavenia boli úspešne uložené");
        setShowSaveModal(true);
      } catch (err) {
        console.error(err);
        setModalType("error");
        setModalMessage("Ukladanie nastavení zlyhalo");
        setShowSaveModal(true);
      }
    })();
  };

  const handleTestConnection = () => {
    (async () => {
      try {
        const res = await settingsApi.testEmail();
        setModalType("success");
        setModalMessage(res?.message || "Testovanie spojenia: OK");
        setShowTestModal(true);
      } catch (err) {
        console.error(err);
        setModalType("error");
        setModalMessage("Test spojenia zlyhal");
        setShowTestModal(true);
      }
    })();
  };

  const handleClearData = () => {
    setModalType("confirm");
    setModalMessage("Naozaj chcete vymazať všetky tréningové dáta?");
    setShowClearDataModal(true);
  };

  const confirmClearData = () => {
    (async () => {
      try {
        const res = await settingsApi.clearData();
        setModalType("success");
        setModalMessage(res?.message || "Dáta boli úspešne vymazané");
        setShowClearDataModal(true);
      } catch (err) {
        console.error(err);
        setModalType("error");
        setModalMessage("Vymazávanie dát zlyhalo");
        setShowClearDataModal(true);
      }
    })();
  };

  const handleResetSystem = () => {
    setModalType("confirm");
    setModalMessage("Naozaj chcete resetovať systém do pôvodného stavu?");
    setShowResetModal(true);
  };

  const confirmResetSystem = () => {
    (async () => {
      try {
        const res = await settingsApi.reset();
        setModalType("success");
        setModalMessage(res?.message || "Systém bol úspešne resetovaný");
        setShowResetModal(true);
        if (res?.settings) {
          const data = res.settings;
          setSystemSettings({
            systemName: data.system?.system_name || "",
            supportEmail: data.system?.support_email || "",
            maxSessionDuration: data.system?.max_session_duration || 30,
          });
          setNotifications({
            emailNotifications: !!data.notifications?.email_notifications,
            weeklyReports: !!data.notifications?.weekly_reports,
            performanceAlerts: !!data.notifications?.performance_alerts,
          });
          setSecurity({
            minPasswordLength: data.security?.min_password_length || 8,
            sessionTimeout: data.security?.session_timeout || 60,
            twoFactorAuth: !!data.security?.two_factor_auth,
          });
          setTraining({
            minPassingScore: data.training?.min_passing_score || 75,
            scenarioRotation: !!data.training?.scenario_rotation,
            autoEvaluation: !!data.training?.auto_evaluation,
          });
          setEmailConfig({
            smtpServer: data.email?.smtp_server || "",
            smtpPort: data.email?.smtp_port || 587,
            username: data.email?.username || "",
            password: data.email?.password || "",
          });
        }
      } catch (err) {
        console.error(err);
        setModalType("error");
        setModalMessage("Reset systému zlyhal");
        setShowResetModal(true);
      }
    })();
  };

  return (
    <div className="pageBackground">
      {/* Header */}
      <DashboardHeader userName="Admin" userRole="Admin" />

      {/* Content */}
      <div className="content-container">
        {/* Title */}
        <div className="title-section">
          <h2 className="page-title">Systémové nastavenia</h2>
          <Button
            appearance="primary"
            color="red"
            startIcon={<Save size={16} />}
            onClick={handleSaveChanges}
          >
            Uložiť zmeny
          </Button>
        </div>

        {/* General Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Settings size={20} />
            <h3 className="settings-section-title">Všeobecné nastavenia</h3>
          </div>
          <p className="settings-section-description">
            Základné nastavenia systému CallTrainer
          </p>

          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="systemName">
                Názov systému
              </label>
              <input
                id="systemName"
                type="text"
                className="settings-input"
                value={systemSettings.systemName}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    systemName: e.target.value,
                  })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="supportEmail">
                Email podpory
              </label>
              <input
                id="supportEmail"
                type="email"
                className="settings-input"
                value={systemSettings.supportEmail}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    supportEmail: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="maxSessionDuration">
              Max. trvanie sedenia (minúty)
            </label>
            <input
              id="maxSessionDuration"
              type="number"
              className="settings-input-small"
              value={systemSettings.maxSessionDuration}
              onChange={(e) =>
                setSystemSettings({
                  ...systemSettings,
                  maxSessionDuration: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Bell size={20} />
            <h3 className="settings-section-title">Notifikácie</h3>
          </div>
          <p className="settings-section-description">
            Nastavenia pre emailové notifikácie a upozornenia
          </p>

          <div className="settings-toggle-list">
            <div className="settings-toggle-item">
              <div>
                <p className="settings-toggle-label">Emailové notifikácie</p>
                <p className="settings-toggle-description">
                  Posielať emailové notifikácie používateľom
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-toggle-item">
              <div>
                <p className="settings-toggle-label">Týždenné reporty</p>
                <p className="settings-toggle-description">
                  Automatické generovanie týždenných reportov
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.weeklyReports}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      weeklyReports: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-toggle-item">
              <div>
                <p className="settings-toggle-label">Upozornenia na výkon</p>
                <p className="settings-toggle-description">
                  Upozorniť administrátorov pri nízkych skóre
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.performanceAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      performanceAlerts: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Shield size={20} />
            <h3 className="settings-section-title">Zabezpečenie</h3>
          </div>
          <p className="settings-section-description">
            Nastavenia bezpečnosti a autentifikácie
          </p>

          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="minPasswordLength">
                Minimálna dĺžka hesla
              </label>
              <input
                id="minPasswordLength"
                type="number"
                className="settings-input-small"
                value={security.minPasswordLength}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    minPasswordLength: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="sessionTimeout">
                Timeout sedenia (minúty)
              </label>
              <input
                id="sessionTimeout"
                type="number"
                className="settings-input-small"
                value={security.sessionTimeout}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    sessionTimeout: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>

          <div className="settings-toggle-item">
            <div>
              <p className="settings-toggle-label">
                Dvojfaktorová autentifikácia
              </p>
              <p className="settings-toggle-description">
                Povoliť 2FA pre všetkých používateľov
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={security.twoFactorAuth}
                onChange={(e) =>
                  setSecurity({
                    ...security,
                    twoFactorAuth: e.target.checked,
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Training Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <TrendingUp size={20} />
            <h3 className="settings-section-title">Tréningové nastavenia</h3>
          </div>
          <p className="settings-section-description">
            Nastavenia pre tréningové scenáre a hodnotenie
          </p>

          <div className="settings-field">
            <label className="settings-label" htmlFor="minPassingScore">
              Minimálne prechádzajúce skóre (%)
            </label>
            <input
              id="minPassingScore"
              type="number"
              className="settings-input-small"
              value={training.minPassingScore}
              onChange={(e) =>
                setTraining({
                  ...training,
                  minPassingScore: parseInt(e.target.value, 10),
                })
              }
            />
            <p className="settings-field-hint">
              Minimálne skóre potrebné na úspešné absolvovanie scenára
            </p>
          </div>

          <div className="settings-toggle-list">
            <div className="settings-toggle-item">
              <div>
                <p className="settings-toggle-label">Rotácia scenárov</p>
                <p className="settings-toggle-description">
                  Automaticky rotovať scenáre pre rozmanitosť
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={training.scenarioRotation}
                  onChange={(e) =>
                    setTraining({
                      ...training,
                      scenarioRotation: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-toggle-item">
              <div>
                <p className="settings-toggle-label">Automatické hodnotenie</p>
                <p className="settings-toggle-description">
                  Použiť AI pre automatické hodnotenie hovorov
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={training.autoEvaluation}
                  onChange={(e) =>
                    setTraining({
                      ...training,
                      autoEvaluation: e.target.checked,
                    })
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Mail size={20} />
            <h3 className="settings-section-title">Konfigurácia emailu</h3>
          </div>
          <p className="settings-section-description">
            SMTP nastavenia pre odosielanie emailov
          </p>

          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="smtpServer">
                SMTP server
              </label>
              <input
                id="smtpServer"
                type="text"
                className="settings-input"
                value={emailConfig.smtpServer}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    smtpServer: e.target.value,
                  })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="smtpPort">
                Port
              </label>
              <input
                id="smtpPort"
                type="number"
                className="settings-input-small"
                value={emailConfig.smtpPort}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    smtpPort: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="emailUsername">
                Používateľské meno
              </label>
              <input
                id="emailUsername"
                type="email"
                className="settings-input"
                value={emailConfig.username}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    username: e.target.value,
                  })
                }
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="emailPassword">
                Heslo
              </label>
              <input
                id="emailPassword"
                type="password"
                className="settings-input"
                value={emailConfig.password}
                onChange={(e) =>
                  setEmailConfig({
                    ...emailConfig,
                    password: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <Button
            appearance="default"
            onClick={handleTestConnection}
            style={{ marginTop: "12px" }}
          >
            Otestovať spojenie
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <div className="settings-section-header">
            <h3 className="settings-section-title danger-title">
              Nebezpečná zóna
            </h3>
          </div>
          <p className="settings-section-description">
            Nevratné akcie - buďte opatrní
          </p>

          <div className="danger-action">
            <div>
              <p className="danger-action-title">
                Vymazať všetky tréningové dáta
              </p>
              <p className="danger-action-description">
                Odstráni všetky záznamy hovorov a štatistiky
              </p>
            </div>
            <Button appearance="ghost" color="red" onClick={handleClearData}>
              Vymazať
            </Button>
          </div>

          <div className="danger-action">
            <div>
              <p className="danger-action-title">Reset systému</p>
              <p className="danger-action-description">
                Vráti systém do pôvodného stavu
              </p>
            </div>
            <Button appearance="ghost" color="red" onClick={handleResetSystem}>
              Reset
            </Button>
          </div>
        </div>
      </div>
      <Footer />

      {/* Success/Error Modal */}
      {(showSaveModal || showTestModal) && modalType !== "confirm" && (
        <div
          className="profile-modal-overlay"
          onClick={() => {
            setShowSaveModal(false);
            setShowTestModal(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowSaveModal(false);
              setShowTestModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              maxWidth: "500px",
              textAlign: "center",
              padding: "40px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                margin: "0 auto 24px",
                backgroundColor:
                  modalType === "success" ? "#e8f5e9" : "#ffebee",
              }}
            >
              {modalType === "success" ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4caf50"
                  strokeWidth="3"
                  role="img"
                  aria-label="Úspech"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="3"
                  role="img"
                  aria-label="Chyba"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              {modalType === "success" ? "Úspech" : "Chyba"}
            </h3>
            <p
              style={{
                marginBottom: "32px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              {modalMessage}
            </p>
            <Button
              appearance="primary"
              color="red"
              onClick={() => {
                setShowSaveModal(false);
                setShowTestModal(false);
              }}
              style={{ minWidth: "120px" }}
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Clear Data Confirm Modal */}
      {showClearDataModal && modalType === "confirm" && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowClearDataModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowClearDataModal(false);
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              maxWidth: "520px",
              padding: "32px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                margin: "0 auto 20px",
                backgroundColor: "#fff3e0",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff9800"
                strokeWidth="2"
                role="img"
                aria-label="Varovanie"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                textAlign: "center",
              }}
            >
              Potvrdenie akcie
            </h3>
            <p
              style={{
                marginBottom: "32px",
                color: "#6b7280",
                fontSize: "14px",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
              {modalMessage}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <Button
                appearance="default"
                onClick={() => setShowClearDataModal(false)}
                style={{ minWidth: "120px" }}
              >
                Zrušiť
              </Button>
              <Button
                appearance="primary"
                color="red"
                onClick={confirmClearData}
                style={{ minWidth: "120px" }}
              >
                Vymazať
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Result Modal */}
      {showClearDataModal && modalType !== "confirm" && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowClearDataModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowClearDataModal(false);
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              maxWidth: "500px",
              textAlign: "center",
              padding: "40px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                margin: "0 auto 24px",
                backgroundColor:
                  modalType === "success" ? "#e8f5e9" : "#ffebee",
              }}
            >
              {modalType === "success" ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4caf50"
                  strokeWidth="3"
                  role="img"
                  aria-label="Úspech"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="3"
                  role="img"
                  aria-label="Chyba"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              {modalType === "success" ? "Úspech" : "Chyba"}
            </h3>
            <p
              style={{
                marginBottom: "32px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              {modalMessage}
            </p>
            <Button
              appearance="primary"
              color="red"
              onClick={() => setShowClearDataModal(false)}
              style={{ minWidth: "120px" }}
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Reset System Confirm Modal */}
      {showResetModal && modalType === "confirm" && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowResetModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowResetModal(false);
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              maxWidth: "520px",
              padding: "32px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                margin: "0 auto 20px",
                backgroundColor: "#fff3e0",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff9800"
                strokeWidth="2"
                role="img"
                aria-label="Varovanie"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
                textAlign: "center",
              }}
            >
              Potvrdenie akcie
            </h3>
            <p
              style={{
                marginBottom: "32px",
                color: "#6b7280",
                fontSize: "14px",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
              {modalMessage}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <Button
                appearance="default"
                onClick={() => setShowResetModal(false)}
                style={{ minWidth: "120px" }}
              >
                Zrušiť
              </Button>
              <Button
                appearance="primary"
                color="red"
                onClick={confirmResetSystem}
                style={{ minWidth: "120px" }}
              >
                Resetovať
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Result Modal */}
      {showResetModal && modalType !== "confirm" && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowResetModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowResetModal(false);
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
            style={{
              maxWidth: "500px",
              textAlign: "center",
              padding: "40px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                margin: "0 auto 24px",
                backgroundColor:
                  modalType === "success" ? "#e8f5e9" : "#ffebee",
              }}
            >
              {modalType === "success" ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4caf50"
                  strokeWidth="3"
                  role="img"
                  aria-label="Úspech"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="3"
                  role="img"
                  aria-label="Chyba"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              )}
            </div>
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              {modalType === "success" ? "Úspech" : "Chyba"}
            </h3>
            <p
              style={{
                marginBottom: "32px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              {modalMessage}
            </p>
            <Button
              appearance="primary"
              color="red"
              onClick={() => setShowResetModal(false)}
              style={{ minWidth: "120px" }}
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
