// src/pages/Premium.jsx
import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { getFreeNewChatsPerDay, ymd } from "../services/limits";
import { checkout, getStripeConfig } from "../services/stripe";

export default function Premium() {
  const { user } = useAuth() || {};
  const uid = user?.uid || null;

  const [limit, setLimit] = useState(3);
  const [count, setCount] = useState(0);
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      const v = await getFreeNewChatsPerDay();
      if (!stop) setLimit(v);
      const c = await getStripeConfig();
      if (!stop) setCfg(c);
    })();
    return () => { stop = true; };
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
      await checkout(plan); // 'monthly' or 'yearly'
    } finally {
      setBusy(false);
    }
  }

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
                disabled={busy || !cfg?.priceMonthly}
                title={!cfg?.priceMonthly ? "Missing Stripe config" : "Upgrade monthly"}
              >
                {busy ? "Redirecting…" : "Upgrade monthly"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100 border-primary">
            <div className="card-body d-flex flex-column">
              <h5 className="fw-bold">Yearly <span className="badge bg-primary">Best value</span></h5>
              <p className="text-muted small">Save more with an annual plan.</p>
              <ul className="text-muted small mb-3">
                <li>All monthly features</li>
                <li>Extra boost credits</li>
                <li>Priority support</li>
              </ul>
              <button
                className="btn btn-primary fw-bold mt-auto"
                onClick={() => go("yearly")}
                disabled={busy || !cfg?.priceYearly}
                title={!cfg?.priceYearly ? "Missing Stripe config" : "Upgrade yearly"}
              >
                {busy ? "Redirecting…" : "Upgrade yearly"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-muted small mt-3">
        Powered by Stripe. You can cancel anytime from your Stripe customer portal.
      </div>
    </div>
  );
}
