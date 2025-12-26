"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "rsuite";

interface DashboardHeaderProps {
  userName?: string;
  userRole: "Admin" | "Operátor";
  userRoleDisplay?: string;
}

export default function DashboardHeader({
  userName,
  userRole,
  userRoleDisplay,
}: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const handleLogoClick = () => {
    if (userRole === "Admin") {
      router.push("/dashboard");
    } else {
      router.push("/operatorBoard");
    }
  };

  const displayRole =
    userRoleDisplay || (userRole === "Admin" ? "Administrátor" : "Operátor");
  const displayName = userName || "Admin";

  return (
    <div className="header">
      <button
        type="button"
        className="dashboard-logo"
        onClick={handleLogoClick}
        style={{
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        <div
          className="dashboard-logo-icon"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "50px",
            minWidth: "40px",
            minHeight: "40px",
          }}
        >
          <Image
            src="/logo 155.png"
            alt="Medical Emergency Logo"
            width={50}
            height={50}
            style={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        </div>
        <div className="dashboard-logo-text">
          <Image
            src="/Nadpis CallTrainer.png"
            alt="CallTrainer Logo"
            width={150}
            height={150}
            style={{ objectFit: "contain" }}
          />
        </div>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div className="dashboard-user-info">
          <p style={{ fontWeight: "bold" }}>{displayName}</p>
          <p className="dashboard-user-role">{displayRole}</p>
        </div>
        <Button appearance="ghost" color="red" onClick={handleLogout}>
          Odhlásiť sa
        </Button>
      </div>
    </div>
  );
}
