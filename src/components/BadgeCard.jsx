// src/components/BadgeCard.jsx
import React from "react";

export default function BadgeCard({ icon, label, desc, earned }) {
  return (
    <div
      className="card"
      style={{
        padding: 12,
        borderRadius: 12,
        opacity: earned ? 1 : 0.45,
        filter: earned ? "none" : "grayscale(0.8)",
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "#fff",
        minWidth: 160
      }}
      title={earned ? "Earned" : "Locked"}
    >
      <div style={{ fontSize: 28, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontWeight: 800, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.9 }}>{desc}</div>
      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>
        {earned ? "Unlocked" : "Locked"}
      </div>
    </div>
  );
}
