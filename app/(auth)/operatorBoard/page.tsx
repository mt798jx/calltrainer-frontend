"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Loader, Message, Modal, useToaster } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { useStartTask, useTasksDashboard } from "@/hooks/useTasks";
import Footer from "../components/Footer";

export default function OperatorBoardPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();
  const { data: tasksData } = useTasksDashboard(user?.id);
  const startTaskMutation = useStartTask();
  const toaster = useToaster();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (error || (!isLoading && !user)) {
      router.push("/login");
    }
  }, [user, isLoading, error, router]);

  const handleScenariosClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmStart = async () => {
    // Find a task to start (pending or progress, or just first one)
    const taskToStart =
      tasksData?.tasks.find(
        (t) => t.status === "pending" || t.status === "progress",
      ) || tasksData?.tasks[0];

    if (taskToStart && user) {
      try {
        const result = await startTaskMutation.mutateAsync({
          taskId: taskToStart.id,
          operatorId: user.id,
        });

        router.push(
          `/operatorBoard/training-session?task_id=${taskToStart.id}&scenario_title=${encodeURIComponent(result.scenario_title)}`,
        );
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to start task:", error);
        toaster.push(
          <Message showIcon type="error">
            Nepodarilo sa spustiť úlohu. Skúste to prosím neskôr.
          </Message>,
          { placement: "topEnd" },
        );
      }
    } else {
      toaster.push(
        <Message showIcon type="warning">
          Žiadne dostupné úlohy na spustenie.
        </Message>,
        { placement: "topEnd" },
      );
      setIsModalOpen(false);
    }
  };

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

  return (
    <>
      <div className="pageBackground">
        {/* Header */}
        <DashboardHeader
          userName={`${user.first_name} ${user.last_name}`}
          userRole="Operátor"
        />

        {/* Content */}
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <h2>
              Vitajte, {user.first_name} {user.last_name}
            </h2>
            <p>Operátorský panel CallTrainer</p>
          </div>

          <div className="dashboard-grid">
            {/* Moje úlohy */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/operatorBoard/tasks")}
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
                </svg>
              </div>
              <h3>Moje úlohy</h3>
              <p>Priradené tréningové úlohy</p>
            </button>

            {/* Scenáre */}
            <button
              className="dashboard-card"
              type="button"
              onClick={handleScenariosClick}
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
              <h3>Tréningové scenáre</h3>
              <p>Dostupné scenáre na precvičenie</p>
            </button>

            {/* História */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/operatorBoard/history")}
            >
              <div className="dashboard-card-icon icon-blue">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="História ikona"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>História</h3>
              <p>Pozrite si vaše predchádzajúce hovory</p>
            </button>

            {/* Moje štatistiky */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/operatorBoard/stats")}
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
              <h3>Moje štatistiky</h3>
              <p>Môj pokrok a výsledky</p>
            </button>

            {/* Profil */}
            <button
              className="dashboard-card"
              type="button"
              onClick={() => router.push("/operatorBoard/profile")}
            >
              <div className="dashboard-card-icon icon-gray">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="Profil ikona"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Profil</h3>
              <p>Upravte svoje osobné údaje</p>
            </button>
          </div>
        </div>
      </div>
      <Footer />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header>
          <Modal.Title>Spustiť tréningový scenár</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Naozaj chcete spustiť tréningový scenár?</p>
          <br />
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <p
              style={{
                marginBottom: "10px",
                color: "#d9534f",
                fontWeight: "bold",
              }}
            >
              ⚠️ TRÉNINGOVÝ REŽIM
            </p>
            <ul style={{ paddingLeft: "20px", margin: 0 }}>
              <li>
                Prebehne <strong>reálny telefonát</strong> na vaše číslo:{" "}
                <strong>{user?.phone || "Neznáme číslo"}</strong>
              </li>
              <li>
                Tento hovor slúži len na tréning a testovanie, a bude
                realizovaný pomocou AI.
              </li>
              <li>
                <strong>Žiadne dáta sa neukladajú</strong> do databázy
                (história, nahrávky, skóre).
              </li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleConfirmStart} appearance="primary" color="red">
            Áno, spustiť
          </Button>
          <Button onClick={() => setIsModalOpen(false)} appearance="subtle">
            Zrušiť
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
