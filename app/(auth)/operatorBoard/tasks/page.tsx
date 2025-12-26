"use client";

import { useRouter } from "next/navigation";
import { Button, Loader } from "rsuite";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { useStartTask, useTasksDashboard } from "@/hooks/useTasks";
import Footer from "../../components/Footer";

export default function TasksPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const { data: tasksData, isLoading } = useTasksDashboard(user?.id);
  const startTaskMutation = useStartTask();

  const stats = tasksData?.stats || {
    pending: 0,
    completed: 0,
    successRate: "0%",
  };
  const tasks = tasksData?.tasks || [];

  const activeTasks = tasks.filter(
    (task) => task.status === "progress" || task.status === "pending",
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const handleStartTask = async (taskId: string) => {
    if (!user?.id) return;

    try {
      const result = await startTaskMutation.mutateAsync({
        taskId,
        operatorId: user.id,
      });

      // Presmerovanie na stránku so scenármi s parametrami task_id a scenario_title
      // Tieto parametre sa použijú na automatické spustenie AI simulácie
      router.push(
        `/operatorBoard/scenarios?task_id=${taskId}&scenario_title=${encodeURIComponent(result.scenario_title)}`,
      );
    } catch (error) {
      console.error("Failed to start task:", error);
      alert("Nepodarilo sa spustiť úlohu. Skúste to znova.");
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Neurčený";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="pageBackground">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Loader size="lg" content="Načítavam úlohy..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pageBackground">
        {/* Header */}
        <DashboardHeader
          userName={user ? `${user.first_name} ${user.last_name}` : ""}
          userRole="Operátor"
        />

        {/* Content */}
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <h2>Moje úlohy</h2>
            <p>Priradené tréningové úlohy</p>
          </div>

          {/* Stats */}
          <div className="tasks-stats-grid">
            <div className="tasks-stat-card">
              <h3 className="tasks-stat-card-label">Čakajúce úlohy</h3>
              <p className="tasks-stat-card-value tasks-stat-card-value-pending">
                {stats.pending}
              </p>
            </div>

            <div className="tasks-stat-card">
              <h3 className="tasks-stat-card-label">Dokončené</h3>
              <p className="tasks-stat-card-value tasks-stat-card-value-completed">
                {stats.completed}
              </p>
            </div>

            <div className="tasks-stat-card">
              <h3 className="tasks-stat-card-label">Úspešnosť</h3>
              <p className="tasks-stat-card-value tasks-stat-card-value-success">
                {stats.successRate}
              </p>
            </div>
          </div>

          {/* Aktívne úlohy */}
          <h3 className="tasks-title">Aktívne úlohy</h3>
          {activeTasks.length === 0 ? (
            <div className="scenarios-empty">
              <p>Žiadne aktívne úlohy</p>
            </div>
          ) : (
            <div className="tasks-active-grid">
              {activeTasks.map((task) => (
                <div key={task.id} className="tasks-card">
                  <div className="tasks-card-header">
                    <h4 className="tasks-card-title">{task.title}</h4>
                    <span
                      className={`tasks-card-badge ${
                        task.status === "progress"
                          ? "tasks-card-badge-progress"
                          : "tasks-card-badge-pending"
                      }`}
                    >
                      {task.statusLabel}
                    </span>
                  </div>

                  {task.statusText && (
                    <p className="tasks-card-status">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <title>Status indicator</title>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      {task.statusText}
                    </p>
                  )}

                  <p className="tasks-card-description">{task.description}</p>

                  <div className="tasks-card-info">
                    <div className="tasks-card-info-item">
                      📅 Termín
                      <span className="tasks-card-info-item-value">
                        {formatDate(task.deadline)}
                        {task.daysLeft !== null &&
                          task.daysLeft !== undefined &&
                          ` (${task.daysLeft} dní)`}
                      </span>
                    </div>
                  </div>

                  <div className="tasks-card-info">
                    <div className="tasks-card-info-item">
                      🎯 Minimálne skóre
                      <span className="tasks-card-info-item-value">
                        {task.minScore}%
                      </span>
                    </div>
                  </div>

                  <div className="tasks-card-info">
                    <div className="tasks-card-info-item">
                      📊 Pokusy
                      <span className="tasks-card-info-item-value">
                        {task.attempts.current} / {task.attempts.total} (
                        {task.attempts.remaining} zostávajú)
                      </span>
                    </div>
                  </div>

                  {task.status === "progress" && (
                    <>
                      <div className="tasks-progress-bar">
                        <div
                          className="tasks-progress-bar-fill"
                          style={{ width: `${task.currentScore ?? 0}%` }}
                        ></div>
                      </div>
                      <div className="tasks-progress-label">
                        Najlepšie skóre:{" "}
                        <span className="tasks-progress-label-value">
                          {task.currentScore ?? 0}%
                        </span>
                      </div>
                    </>
                  )}

                  {(() => {
                    const remaining = task.attempts?.remaining ?? 0;
                    const attemptsExhausted = remaining <= 0;

                    return (
                      <Button
                        appearance="primary"
                        color="red"
                        block
                        onClick={() => {
                          if (attemptsExhausted) return;
                          handleStartTask(task.id);
                        }}
                        loading={startTaskMutation.isPending}
                        disabled={
                          startTaskMutation.isPending || attemptsExhausted
                        }
                        style={{ marginTop: "auto" }}
                      >
                        {attemptsExhausted
                          ? "Pokusy vyčerpané"
                          : task.buttonLabel}
                      </Button>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          {/* Dokončené úlohy */}
          <h3 className="tasks-title">Dokončené úlohy</h3>
          {completedTasks.length === 0 ? (
            <div className="scenarios-empty">
              <p>Žiadne dokončené úlohy</p>
            </div>
          ) : (
            <div className="tasks-completed-container">
              {completedTasks.map((task) => (
                <div key={task.id} className="tasks-completed-header">
                  <div className="tasks-completed-content">
                    <span className="tasks-completed-icon">✓</span>
                    <div>
                      <h4 className="tasks-completed-info-title">
                        {task.title}
                      </h4>
                      <p className="tasks-completed-info-date">
                        Dokončené: {formatDate(task.completedDate)}
                      </p>
                      <div className="tasks-completed-info-stats">
                        <span>
                          Skóre:{" "}
                          <span className="tasks-completed-info-stat-value">
                            {task.score}%
                          </span>
                        </span>
                        <span>
                          Pokusy: <strong>{task.attempts.current}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="tasks-completed-badge">Úspešne splnené</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
