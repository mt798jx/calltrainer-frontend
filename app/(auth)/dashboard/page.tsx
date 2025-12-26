"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Loader } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import Footer from "../components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();

  useEffect(() => {
    if (error || (!isLoading && !user)) {
      router.push("/login");
    }
  }, [user, isLoading, error, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Loader size="lg" content="Načítavam..." />
      </div>
    );
  }

  if (!user) return null;

  // Ak je operátor, presmeruj na Moje úlohy
  if (user.role === "OPERATOR") {
    return (
      <>
        <div className="pageBackground">
          {/* Header */}
          <DashboardHeader
            userName={`${user.first_name} ${user.last_name}`}
            userRole="Operátor"
          />

          {/* Content */}
          <div className="my-tasks-content">
            <div className="my-tasks-title-bar">
              <h2 className="my-tasks-page-title">Moje úlohy</h2>
              <div>2 aktívnych</div>
            </div>

            {/* Stats */}
            <div className="my-tasks-stats-grid">
              <div className="my-tasks-stat-card">
                <h3 className="my-tasks-stat-label">Čakajúce úlohy</h3>
                <p className="my-tasks-stat-value">2</p>
              </div>

              <div className="my-tasks-stat-card">
                <h3 className="my-tasks-stat-label">Dokončené</h3>
                <p className="my-tasks-stat-value my-tasks-stat-value-completed">
                  1
                </p>
              </div>

              <div className="my-tasks-stat-card">
                <h3 className="my-tasks-stat-label">Úspešnosť</h3>
                <p className="my-tasks-stat-value my-tasks-stat-value-success">
                  33%
                </p>
              </div>
            </div>

            {/* Aktívne úlohy */}
            <div className="my-tasks-section">
              <h3 className="my-tasks-section-title">Aktívne úlohy</h3>
              <div className="my-tasks-grid">
                {/* Úloha 1 */}
                <div className="my-tasks-card">
                  <div className="my-tasks-card-header">
                    <h4 className="my-tasks-card-title">
                      Základný tréning - Bolest na hrudníku
                    </h4>
                    <span className="my-tasks-badge my-tasks-badge-progress">
                      Prebieba
                    </span>
                  </div>

                  <p className="my-tasks-card-alert">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ display: "inline", marginRight: "6px" }}
                    >
                      <title>Alert icon</title>
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Potrebný zlepšenie - aktuálne skóre: 78%
                  </p>

                  <p className="my-tasks-card-description">
                    Povinný tréning pre všetkých nových operátorov
                  </p>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">📅 Termín</span>
                      <span className="my-tasks-info-value">
                        15. novembra 2025 (9 dní)
                      </span>
                    </div>
                  </div>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">
                        🎯 Minimálne skóre
                      </span>
                      <span className="my-tasks-info-value">85%</span>
                    </div>
                  </div>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">📊 Pokusy</span>
                      <span className="my-tasks-info-value">
                        1 / 3 (2 zostávajú)
                      </span>
                    </div>
                  </div>

                  <div className="my-tasks-progress-bar">
                    <div
                      className="my-tasks-progress-fill"
                      style={{ width: "78%" }}
                    ></div>
                  </div>
                  <div className="my-tasks-progress-info">
                    Najlepšie skóre:{" "}
                    <strong style={{ color: "#ff9800" }}>78%</strong>
                  </div>

                  <Button
                    appearance="primary"
                    color="red"
                    block
                    style={{ marginTop: "16px" }}
                  >
                    Opakovať pokus
                  </Button>
                </div>

                {/* Úloha 2 */}
                <div className="my-tasks-card">
                  <div className="my-tasks-card-header">
                    <h4 className="my-tasks-card-title">
                      Pokročilý tréning - Úrazy
                    </h4>
                    <span className="my-tasks-badge my-tasks-badge-waiting">
                      Čaká
                    </span>
                  </div>

                  <p className="my-tasks-card-description">
                    Scenáre s úrazmi pre pokročilých operátorov
                  </p>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">📅 Termín</span>
                      <span className="my-tasks-info-value">
                        10. novembra 2025 (4 dni)
                      </span>
                    </div>
                  </div>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">
                        🎯 Minimálne skóre
                      </span>
                      <span className="my-tasks-info-value">90%</span>
                    </div>
                  </div>

                  <div className="my-tasks-card-info">
                    <div className="my-tasks-info-item">
                      <span className="my-tasks-info-label">📊 Pokusy</span>
                      <span className="my-tasks-info-value">
                        0 / 2 (2 zostávajú)
                      </span>
                    </div>
                  </div>

                  <Button
                    appearance="primary"
                    color="red"
                    block
                    style={{ marginTop: "16px" }}
                  >
                    Začať úlohu
                  </Button>
                </div>
              </div>
            </div>

            {/* Dokončené úlohy */}
            <div className="my-tasks-section">
              <h3 className="my-tasks-section-title">Dokončené úlohy</h3>
              <div className="my-tasks-empty">
                <p>Žiadne dokončené úlohy</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Admin dashboard
  return (
    <>
      <div className="pageBackground">
        {/* Header */}
        <DashboardHeader userName="Admin" userRole="Admin" />

        {/* Content */}
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <h2>Vitajte, Admin</h2>
            <p>Administrátorský panel CallTrainer</p>
          </div>

          <div className="dashboard-grid">
            {/* Používatelia */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/dashboard/users")}
            >
              <div className="dashboard-card-icon icon-blue">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="Používatelia ikona"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Používatelia</h3>
              <p>Správa používateľov a oprávnení</p>
            </button>

            {/* Scenáre - PRIDANÝ ONCLICK */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/dashboard/scenarios")}
            >
              <div className="dashboard-card-icon icon-purple">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  role="img"
                  aria-label="Scenáre ikona"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <h3>Scenáre</h3>
              <p>Správa tréningových scenárov</p>
            </button>

            {/* Úlohy */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/dashboard/tasks")}
            >
              <div className="dashboard-card-icon icon-yellow">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  role="img"
                  aria-label="Úlohy ikona"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8" fill="white"></polyline>
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="white"
                    strokeWidth="2"
                  ></line>
                  <line
                    x1="16"
                    y1="17"
                    x2="8"
                    y2="17"
                    stroke="white"
                    strokeWidth="2"
                  ></line>
                  <polyline
                    points="10 9 9 9 8 9"
                    stroke="white"
                    strokeWidth="2"
                  ></polyline>
                </svg>
              </div>
              <h3>Úlohy</h3>
              <p>Priradenie úloh operátorom</p>
            </button>

            {/* Štatistiky */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/dashboard/stats")}
            >
              <div className="dashboard-card-icon icon-green">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="Štatistiky ikona"
                >
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
              </div>
              <h3>Štatistiky</h3>
              <p>Celkové štatistiky systému</p>
            </button>

            {/* Nastavenia */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/dashboard/settings")}
            >
              <div className="dashboard-card-icon icon-orange">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  role="img"
                  aria-label="Nastavenia ikona"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path
                    d="M12 1v6m0 6v6m9-9h-6m-6 0H3"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  ></path>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <h3>Nastavenia</h3>
              <p>Systémové nastavenia</p>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
