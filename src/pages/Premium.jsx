// src/pages/Premium.jsx
import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { getFreeNewChatsPerDay, ymd } from "../services/limits";

export default function Premium() {
  const { user } = useAuth() || {};
  const uid = user?.uid || null;

  const [limit, setLimit] = useState(3);
  const [count, setCount] = useState(0);

  // Load dynamic freeNewChatsPerDay from /config/app (or fallback to 3)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await getFreeNewChatsPerDay();
      if (!cancelled) setLimit(v);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live-subscribe to today's meter: /meters/{uid}/daily/{YYYYMMDD}
  useEffect(() => {
    if (!uid) return;
    const today = ymd();
    const ref = doc(db, "meters", uid, "daily", today);
    const unsub = onSnapshot(ref, (snap) => {
      const c = snap.exists() ? Number(snap.data()?.count || 0) : 0;
      setCount(c);
    });
    return unsub;
  }, [uid]);

  const left = useMemo(() => Math.max(0, limit - count), [limit, count]);
  const pct = useMemo(() => Math.min(100, Math.round((count / Math.max(1, limit)) * 100)), [count, limit]);

  return (
    <div className="container py-3">
      <h4 className="fw-bold mb-3">Upgrade</h4>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">New chats today</div>
            <div className="text-muted small">{count} / {limit}</div>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-muted small mt-2">
            {left > 0
              ? `${left} free new ${left === 1 ? "chat" : "chats"} left today.`
              : "You’ve reached today’s free new chat limit."}
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="fw-bold">Go Premium</h5>
          <p className="text-muted mb-3">
            Unlock unlimited new conversations, see who liked you, read receipts, and boost perks.
          </p>

          <ul className="text-muted mb-3">
            <li>Unlimited new chats</li>
            <li>See who liked you</li>
            <li>Read receipts</li>
            <li>Boost discounts</li>
          </ul>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary fw-bold"
              onClick={() => {
                // Stripe will plug in here later
                alert("Checkout coming soon (Stripe)!");
              }}
            >
              Upgrade now
            </button>
            <a href="/browse" className="btn btn-outline-secondary">Keep browsing</a>
          </div>
        </div>
      </div>
    </div>
  );
}
