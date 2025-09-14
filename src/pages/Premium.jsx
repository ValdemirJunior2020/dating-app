// src/pages/Premium.jsx
import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { getFreeNewChatsPerDay, ymd } from "../services/limits";
import { checkout, getStripeConfig, isBillingEnabled, openPortal } from "../services/stripe";

export default function Premium() {
  const { user } = useAuth() || {};
  const uid = user?.uid || null;

  const [limit, setLimit] = useState(3);
  const [count, setCount] = useState(0);
  const [cfg, setCfg] = useState({ billingEnabled: false });
  const [busy, setBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      const [lim, conf] = await Promise.all([getFreeNewChatsPerDay(), getStripeConfig()]);
      if (!stop) {
        setLimit(lim);
        setCfg(conf);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "meters", uid, "daily", ymd());
    const unsub = onSnapshot(ref, (snap) => {
      setCount(snap.exists() ? Number(snap.data()?.count || 0) : 0);
    });
    return unsub;
  }, [uid]);

  const left = useMemo(() => Math.max(0, limit - count), [limit, count]);
  const pct = useMemo(
    () => Math.min(100, Math.round((count / Math.max(1, limit)) * 100)),
    [count, limit]
  );

  async function go(plan) {
    if (busy) return;
    try {
      setBusy(true);
      const enabled = await isBillingEnabled();
      if (!enabled) {
        alert("Billing is not enabled yet. Please check back soon!");
        return;
      }
      await checkout(plan); // 'monthly' | 'yearly'
    } catch (e) {
      if (e?.code === "BILLING_DISABLED") {
        alert("Billing is not enabled yet. Please check back soon!");
      } else {
        alert(e?.message || String(e));
      }
    } finally {
      setBusy(false);
    }
  }

  async function manage() {
    if (portalBusy) return;
    try {
      setPortalBusy(true);
      const enabled = await isBillingEnabled();
      if (!enabled) {
        alert("Billing is not enabled yet. Please check back soon!");
        return;
      }
      await openPortal();
    } catch (e) {
      if (e?.code === "BILLING_DISABLED") {
        alert("Billing is not enabled yet. Please check back soon!");
      } else {
        alert(e?.message || String(e));
      }
    } finally {
      setPortalBusy(false);
    }
  }

  const disabled = !cfg.billingEnabled;

  return (
    <div className="container py-3">
      <h4 className="fw-bold mb-3">Upgrade</h4>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">New chats today</div>
            <div className="text-muted small">
              {count} / {limit}
            </div>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-muted small mt-2">
            {left > 0
              ? `${left} free ${left === 1 ? "chat" : "chats"} left today.`
              : "You’ve reached today’s free new chat limit."}
          </div>
        </div>
      </div>

      {disabled && (
        <div className="alert alert-warning">
          <strong>Coming soon:</strong> Billing isn’t enabled yet. You can still use the app; upgrades
          will open once payment is configured.
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="fw-bold">Monthly</h5>
              <p className="text-muted small">Unlimited new chats, see who liked you, and more.</p>
              <ul className="text-muted small mb-3">
                <li>Unlimited new chats</li>
                <li>See who liked you</li>
                <li>Read receipts</li>
                <li>Boost discounts</li>
              </ul>
              <button
                className="btn btn-primary fw-bold mt-auto"
                onClick={() => go("monthly")}
                disabled={busy || disabled || !cfg?.priceMonthly}
                title={disabled ? "Billing not enabled yet" : (!cfg?.priceMonthly ? "Missing Monthly price" : "Upgrade monthly")}
              >
                {busy ? "Redirecting…" : "Upgrade monthly"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100 border-primary">
            <div className="card-body d-flex flex-column">
              <h5 className="fw-bold">
                Yearly <span className="badge bg-primary">Best value</span>
              </h5>
              <p className="text-muted small">Save more with an annual plan.</p>
              <ul className="text-muted small mb-3">
                <li>All monthly features</li>
                <li>Extra boost credits</li>
                <li>Priority support</li>
              </ul>
              <button
                className="btn btn-primary fw-bold mt-auto"
                onClick={() => go("yearly")}
                disabled={busy || disabled || !cfg?.priceYearly}
                title={disabled ? "Billing not enabled yet" : (!cfg?.priceYearly ? "Missing Yearly price" : "Upgrade yearly")}
              >
                {busy ? "Redirecting…" : "Upgrade yearly"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manage subscription */}
      <div className="card shadow-sm mt-3">
        <div className="card-body d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-bold">Manage subscription</div>
            <div className="text-muted small">Open your Stripe customer portal.</div>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={manage}
            disabled={portalBusy || disabled}
            title={disabled ? "Billing not enabled yet" : "Open customer portal"}
          >
            {portalBusy ? "Opening…" : "Open portal"}
          </button>
        </div>
      </div>

      <div className="text-muted small mt-3">
        You can cancel anytime from the customer portal.
      </div>
    </div>
  );
}
