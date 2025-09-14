// src/components/PaywallModal.jsx
import React from "react";

export default function PaywallModal({ open, limit = 3, onClose, onUpgrade }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        background: "rgba(0,0,0,.6)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card shadow-lg"
        style={{ maxWidth: 460, width: "100%", borderRadius: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <h5 className="fw-bold mb-2">Daily chat limit reached</h5>
          <p className="text-muted mb-3">
            You’ve started your free {limit} new chats for today. Upgrade to unlock
            unlimited new conversations, see who liked you, and more.
          </p>

          <ul className="text-muted small mb-3">
            <li>Unlimited new chats</li>
            <li>See who liked you</li>
            <li>Read receipts</li>
            <li>Boost discounts</li>
          </ul>

          <div className="d-flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>
              Not now
            </button>
            <button
              className="btn btn-primary fw-bold"
              onClick={onUpgrade}
              title="Upgrade (Stripe coming soon)"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
