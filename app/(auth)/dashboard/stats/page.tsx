"use client";

import { Award, Phone, Target, TrendingUp, Users } from "lucide-react";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useSystemStats } from "@/hooks/useSystemStats";
import Footer from "../../components/Footer";

export default function AdminStatisticsPage() {
  const { data: stats, isLoading, error } = useSystemStats();

  if (isLoading) {
    return <div className="pageBackground">Načítavam štatistiky...</div>;
  }

  if (error || !stats) {
    return (
      <div className="pageBackground">
        Chyba pri načítaní štatistík: {error?.message || "Neznáma chyba"}
      </div>
    );
  }

  const {
    totalUsers,
    activeUsers,
    totalCalls,
    averageScore,
    userGrowth,
    callGrowth,
    topOperators,
    organizationStats,
    systemHealth,
  } = stats;

  return (
    <>
      <div className="pageBackground">
        {/* Header */}
        <DashboardHeader userName="Admin" userRole="Admin" />

        {/* Content */}
        <div className="content-container">
          {/* Title */}
          <div className="title-section">
            <h2 className="page-title">Systémové štatistiky</h2>
            <div className="system-status-badge">
              <TrendingUp size={16} />
              Aktívny systém
            </div>
          </div>

          {/* Main Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <Users size={20} color="#6b7280" />
                <span className="stat-label">Celkovo používateľov</span>
              </div>
              <p className="stat-value">{totalUsers}</p>
              <span className="stat-change">+{userGrowth} tento mesiac</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Target size={20} color="#6b7280" />
                <span className="stat-label">Aktívnych používateľov</span>
              </div>
              <p className="stat-value stat-value-green">{activeUsers}</p>
              <span className="stat-info">
                {totalUsers > 0
                  ? Math.round((activeUsers / totalUsers) * 100)
                  : 0}
                % z celku
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Phone size={20} color="#6b7280" />
                <span className="stat-label">Celkovo hovorov</span>
              </div>
              <p className="stat-value">{totalCalls}</p>
              <span className="stat-change">+{callGrowth} tento mesiac</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <Award size={20} color="#6b7280" />
                <span className="stat-label">Priemerné skóre</span>
              </div>
              <p className="stat-value stat-value-amber">{averageScore}%</p>
              <span className="stat-info">Priemer všetkých hovorov</span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="two-column-grid">
            {/* Top Operators */}
            <div className="section-card">
              <div className="section-header">
                <Award size={20} color="#f59e0b" />
                <h3 className="section-title" style={{ margin: 0 }}>
                  Najlepší operátori
                </h3>
              </div>
              {topOperators.map((op) => (
                <div key={op.rank} className="operator-card">
                  <div className="operator-rank">#{op.rank}</div>
                  <div className="operator-info">
                    <p className="operator-name">{op.name}</p>
                    <p className="operator-org">{op.organization}</p>
                  </div>
                  <div className="operator-stats">
                    <p className="operator-score">{op.score}%</p>
                    <p className="operator-calls">{op.calls} hovorov</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Organization Stats */}
            <div className="section-card">
              <h3 className="section-title">Štatistiky organizácií</h3>
              {organizationStats.map((org) => (
                <div key={org.name} className="org-item">
                  <div className="org-header">
                    <span className="org-name">{org.name}</span>
                    <div className="org-meta">
                      <span className="org-users">
                        {org.users} používateľov
                      </span>
                      <span className="org-score">{org.score}%</span>
                    </div>
                  </div>
                  <div className="org-subheader">
                    <span className="org-calls">
                      {org.calls} hovorov celkovo
                    </span>
                  </div>
                  <div className="progress-bar-thin">
                    <div
                      className="progress-fill"
                      style={{ width: `${(org.calls / 1300) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="section-card">
            <div className="section-header">
              <div className="health-indicator" />
              <h3 className="section-title" style={{ margin: 0 }}>
                Stav systému
              </h3>
            </div>
            <div className="health-grid">
              <div>
                <p className="health-item-label">Dostupnosť systému</p>
                <p className="health-item-value">
                  {systemHealth.availability}%
                </p>
                <div className="progress-bar-thin">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${systemHealth.availability}%`,
                      background: "#10b981",
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="health-item-label">Miera dokončenia</p>
                <p className="health-item-value">{systemHealth.completion}%</p>
                <div className="progress-bar-thin">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${systemHealth.completion}%`,
                      background: "#10b981",
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="health-item-label">Spokojnosť</p>
                <p className="health-item-value">
                  {systemHealth.satisfaction}/5
                </p>
                <div className="progress-bar-thin">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(systemHealth.satisfaction / 5) * 100}%`,
                      background: "#10b981",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
