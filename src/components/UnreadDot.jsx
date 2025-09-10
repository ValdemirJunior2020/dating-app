import React from "react";

export default function UnreadDot({ show }) {
  if (!show) return null;
  return (
    <span
      data-testid="unread-dot"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#dc3545",
        boxShadow: "0 0 0 2px #ffffff",
      }}
    />
  );
}