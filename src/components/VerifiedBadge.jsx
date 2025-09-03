import React from "react";

/**
 * Props:
 *  - show: boolean
 *  - text (optional): override label
 */
export default function VerifiedBadge({ show, text }) {
  if (!show) return null;
  return (
    <span
      title="College email (.edu) verified"
      className="d-inline-flex align-items-center"
      style={{
        background: "#fff8e6",
        border: "1px solid #ffcf7a",
        color: "#6b4b1f",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
        gap: 6
      }}
    >
      {/* checkmark */}
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
      </svg>
      {text || "College verified"}
    </span>
  );
}
