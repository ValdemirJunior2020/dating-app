// src/components/EduOnly.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Wrap any "action area" that should be .edu-only.
 * If either condition is false, it renders children but disabled + message.
 *
 * Props:
 * - canAct: boolean (current user verified)
 * - peerVerified: boolean (other user verified) — optional for Browse
 * - reason?: string (override default reason text)
 * - compact?: boolean (smaller message style)
 */
export default function EduOnly({
  canAct,
  peerVerified = true,
  reason,
  compact = false,
  children,
}) {
  const ok = canAct && peerVerified;

  if (ok) return <>{children}</>;

  const msg =
    reason ||
    (!canAct
      ? "Only college-verified members can start chats or like."
      : "This person isn’t college-verified yet.");

  return (
    <div className={compact ? "text-white-50 small" : "text-white-50"} style={{ cursor: "not-allowed" }}>
      <div
        className="opacity-50"
        style={{ pointerEvents: "none" }}
        aria-disabled="true"
      >
        {children}
      </div>
      <div className={compact ? "mt-1" : "mt-2"}>
        {!canAct ? (
          <>
            {msg}{" "}
            <Link to="/edu-signup" className="link-warning fw-bold">
              Verify your .edu
            </Link>
            .
          </>
        ) : (
          <>{msg}</>
        )}
      </div>
    </div>
  );
}
