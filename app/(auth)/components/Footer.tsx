import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid #e5e7eb",
        padding: "8px 25px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Image
          src="/logo 155.png"
          alt="Medical Emergency Logo"
          width={50}
          height={50}
          style={{ objectFit: "contain" }}
        />
        <Image
          src="/Nadpis CallTrainer.png"
          alt="CallTrainer Logo"
          width={150}
          height={150}
          style={{ objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          flex: 1,
          textAlign: "center",
          color: "#4b5563",
          fontSize: "14px",
        }}
      >
        <span>© 2025 CallTrainer | All rights reserved</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#4b5563",
          fontSize: "14px",
        }}
      >
        <span>Kontakt:</span>
        <span aria-hidden="true">•</span>
        <a
          href="mailto:calltrainer155@gmail.com"
          style={{ color: "#dc2626", textDecoration: "none", fontWeight: 600 }}
        >
          calltrainer155@gmail.com
        </a>
      </div>
    </footer>
  );
}
