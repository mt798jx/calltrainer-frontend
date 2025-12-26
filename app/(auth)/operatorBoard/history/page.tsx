"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { historyApi } from "@/lib/api";
import Footer from "../../components/Footer";

interface CallRecord {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium";
  date: string;
  time: string;
  duration: string;
  score: number;
  operator_id: number;
  scenario_id?: string;
  task_id?: string;
  attempt_id?: string;
  created_at?: string;
}

export default function HistoryPage() {
  const _router = useRouter();
  const { data: user } = useMe();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const filterOptions = [
    { label: "Všetky hovory", value: "all" },
    { label: "Tento týždeň", value: "week" },
    { label: "Tento mesiac", value: "month" },
  ];

  const filterLabel =
    filterOptions.find((f) => f.value === selectedFilter)?.label ||
    "Všetky hovory";

  const getFilteredCalls = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const source = selectedFilter === "all" ? calls : calls;

    if (selectedFilter === "all") {
      return source;
    }

    return source.filter((call) => {
      // Parse date from "27. októbra 2025" format
      const callDate = new Date(
        (call.date || "").replace(/\./, "").replace(" októbra ", "-10-"),
      );

      if (selectedFilter === "week") {
        return callDate >= weekAgo && callDate <= today;
      } else if (selectedFilter === "month") {
        return callDate >= monthAgo && callDate <= today;
      }
      return true;
    });
  };

  const filteredCalls = getFilteredCalls();

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    historyApi
      .list(user.id)
      .then((res) => {
        setCalls(res.calls || []);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err.message || err));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "history-badge-critical";
      case "high":
        return "history-badge-high";
      case "medium":
        return "history-badge-medium";
      default:
        return "";
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 90) return "history-item-score-high";
    if (score >= 75) return "history-item-score-medium";
    return "history-item-score-low";
  };

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
          <div className="history-title-bar">
            <h2 className="history-title">História hovorov</h2>
            <div className="history-filter-group">
              <div className="history-filter-dropdown">
                <button
                  type="button"
                  className="history-filter-button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  🔽 {filterLabel}
                </button>
                {isFilterOpen && (
                  <div
                    className="history-filter-menu"
                    style={{ display: "block" }}
                  >
                    {filterOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`history-filter-item ${selectedFilter === option.value ? "history-filter-item-active" : ""}`}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedFilter(option.value);
                          setIsFilterOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedFilter(option.value);
                            setIsFilterOpen(false);
                          }
                        }}
                      >
                        {selectedFilter === option.value && "✓ "}
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="history-stats-grid">
            <div className="history-stat-card">
              <h3 className="history-stat-label">Celkovo hovorov</h3>
              <p className="history-stat-value">{filteredCalls.length}</p>
            </div>
            <div className="history-stat-card">
              <h3 className="history-stat-label">Priemerne skóre</h3>
              <p className="history-stat-value history-stat-value-accent">
                {filteredCalls.length > 0
                  ? Math.round(
                      filteredCalls.reduce((sum, call) => sum + call.score, 0) /
                        filteredCalls.length,
                    )
                  : 0}
                %{" "}
                <span style={{ fontSize: "18px", marginLeft: "4px" }}>📈</span>
              </p>
            </div>
            <div className="history-stat-card">
              <h3 className="history-stat-label">Posledný hovor</h3>
              <p className="history-stat-value">
                {filteredCalls.length > 0 ? filteredCalls[0].date : "—"}
              </p>
            </div>
          </div>

          {/* History List */}
          <div className="history-list">
            <h3 className="history-list-header">Zoznam hovorov</h3>
            {filteredCalls.length > 0 ? null : (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                Žiadne hovory v tomto období
              </div>
            )}
            {filteredCalls.map((call) => (
              <div key={call.id} className="history-list-item">
                <div className="history-item-main">
                  <div className="history-item-title">
                    {call.name}
                    <span
                      className={`history-item-badge ${getSeverityBadgeClass(call.severity)}`}
                    >
                      {call.severity === "critical"
                        ? "Kritický"
                        : call.severity === "high"
                          ? "Vysoký"
                          : "Stredný"}
                    </span>
                  </div>
                  <div className="history-item-meta">
                    <span>📅 {call.date}</span>
                    <span>� {call.time}</span>
                    <span>Trvanie: {call.duration}</span>
                  </div>
                </div>
                <div className="history-item-actions">
                  <span
                    className={`history-item-score ${getScoreClass(call.score)}`}
                  >
                    {call.score}%
                  </span>
                  <button
                    type="button"
                    className="history-item-view-btn"
                    onClick={() => setSelectedCall(call)}
                    style={{ cursor: "pointer" }}
                    title="View call details"
                  >
                    👁️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedCall && (
          <div
            className="history-modal-overlay"
            onClick={() => setSelectedCall(null)}
            role="dialog"
            aria-modal="true"
            onKeyDown={(e) => e.key === "Escape" && setSelectedCall(null)}
            tabIndex={-1}
          >
            <div
              className="history-modal"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Escape" && setSelectedCall(null)}
              role="document"
            >
              <div className="history-modal-header">
                <h2>Detail hovoru #{selectedCall.id}</h2>
                <button
                  type="button"
                  className="history-modal-close"
                  onClick={() => setSelectedCall(null)}
                >
                  ✕
                </button>
              </div>

              <div className="history-modal-content">
                <div className="history-modal-grid">
                  {/* Left column */}
                  <div className="history-modal-section">
                    <h3 className="history-modal-section-title">Scenár</h3>
                    <p className="history-modal-scenario">
                      {selectedCall.name}
                    </p>
                  </div>

                  {/* Right column */}
                  <div className="history-modal-section">
                    <h3 className="history-modal-section-title">Priorita</h3>
                    <span
                      className={`history-item-badge ${getSeverityBadgeClass(selectedCall.severity)}`}
                    >
                      {selectedCall.severity === "critical"
                        ? "Kritický"
                        : selectedCall.severity === "high"
                          ? "Vysoký"
                          : "Stredný"}
                    </span>
                  </div>
                </div>

                <div className="history-modal-grid">
                  {/* Date and Time */}
                  <div className="history-modal-section">
                    <h3 className="history-modal-section-title">Dátum a čas</h3>
                    <p className="history-modal-text">
                      {selectedCall.date} {selectedCall.time}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="history-modal-section">
                    <h3 className="history-modal-section-title">Trvanie</h3>
                    <p className="history-modal-text">
                      {selectedCall.duration}
                    </p>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="history-modal-section">
                  <h3 className="history-modal-section-title">Celkové skóre</h3>
                  <p className="history-modal-score">{selectedCall.score}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
