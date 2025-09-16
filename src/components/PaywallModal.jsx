// src/components/PaywallModal.jsx
import React from "react";

export default function PaywallModal({ open, limit = 3, onClose, onUpgrade }) {
  if (!open) return null;
  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,.55)" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Upgrade to keep chatting</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            <p className="mb-2">
              You’ve reached the free limit of <strong>{limit}</strong> new conversations.
            </p>
            <ul className="mb-3">
              <li>Unlimited messages</li>
              <li>See who liked you</li>
              <li>Read receipts</li>
            </ul>
            <p className="text-muted small m-0">You can cancel anytime in the billing portal.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Not now</button>
            <button className="btn btn-primary fw-bold" onClick={onUpgrade}>Upgrade</button>
          </div>
        </div>
      </div>
    </div>
  );
}
