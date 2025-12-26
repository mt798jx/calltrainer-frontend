"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  href: string;
  title?: string;
}

export default function BackButton({ href, title = "Späť" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      style={{
        position: "relative",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 24,
        color: "#666",
      }}
      title={title}
    >
      ←
    </button>
  );
}
