"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import DashboardHeader from "@/app/(auth)/components/Header";
import { useMe } from "@/hooks/useAuth";
import { statsApi } from "@/lib/api";
import Footer from "../../components/Footer";

// Function to determine color based on score
const getColorForScore = (score: number): string => {
  if (score >= 90) return "#dc2626"; // Dark red
  if (score >= 85) return "#ef4444"; // Red
  if (score >= 80) return "#f87171"; // Light red
  if (score >= 75) return "#fca5a5"; // Very light red
  return "#fecaca"; // Lightest red
};

export default function StatsPage() {
  const _router = useRouter();
  const { data: user } = useMe();
  const [skills, setSkills] = useState<
    Array<{ id: string; name: string; current: number; target: number }>
  >([]);

  const { data: skillsData, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["skills", user?.id],
    queryFn: () => statsApi.getSkills(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["summary", user?.id],
    queryFn: () => statsApi.getSummary(user?.id || 0),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (skillsData) {
      setSkills(skillsData);
    }
  }, [skillsData]);

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
          <div className="stats-title-bar">
            <h2 className="stats-title">Štatistiky a výkon</h2>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-card-header">
                <span className="stats-card-icon">⏱️</span>
                <h3 className="stats-card-label">Celkovo hovorov</h3>
              </div>
              <p className="stats-card-value">
                {isLoadingSummary ? "..." : (summaryData?.totalCalls ?? 0)}
              </p>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <span className="stats-card-icon">⭐</span>
                <h3 className="stats-card-label">Priemerne skóre</h3>
              </div>
              <p className="stats-card-value stats-card-value-green">
                {isLoadingSummary
                  ? "..."
                  : `${summaryData?.averageScore ?? 0}%`}
              </p>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <span className="stats-card-icon">⏱️</span>
                <h3 className="stats-card-label">Priemerne čas</h3>
              </div>
              <p className="stats-card-value">
                {isLoadingSummary
                  ? "..."
                  : (summaryData?.averageTime ?? "0:00")}
              </p>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <span className="stats-card-icon">🏆</span>
                <h3 className="stats-card-label">Najlepšie skóre</h3>
              </div>
              <p className="stats-card-value stats-card-value-blue">
                {isLoadingSummary ? "..." : `${summaryData?.bestScore ?? 0}%`}
              </p>
            </div>
          </div>

          {/* Zručnosti a pokrok */}
          <div className="stats-section">
            <h3 className="stats-section-title">Zručnosti</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                gap: "32px",
                flexWrap: "wrap",
              }}
            >
              {isLoadingSkills ? (
                <p>Načítavam zručnosti...</p>
              ) : (
                skills.map((skill) => {
                  const pieData = [
                    {
                      name: "Dosiahnuté",
                      value: skill.current,
                      fill: getColorForScore(skill.current),
                    },
                    {
                      name: "Zostáva",
                      value: 100 - skill.current,
                      fill: "#e5e7eb",
                    },
                  ];
                  return (
                    <div
                      key={skill.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: "180px",
                      }}
                    >
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                            startAngle={0}
                            endAngle={-360}
                            strokeWidth={0}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <h4
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginTop: "16px",
                          textAlign: "center",
                        }}
                      >
                        {skill.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#111827",
                          marginTop: "8px",
                        }}
                      >
                        {skill.current}%{" "}
                        <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                          / 100%
                        </span>
                      </p>
                      {skill.current >= skill.target ? (
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#10b981",
                            fontWeight: "600",
                            marginTop: "4px",
                          }}
                        >
                          Ciel splnený
                        </p>
                      ) : (
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#f59e0b",
                            fontWeight: "600",
                            marginTop: "4px",
                          }}
                        >
                          Si pod hranicou cieľa {skill.target}%
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
