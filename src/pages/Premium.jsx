// src/pages/Premium.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * This page calls your Firebase Cloud Functions endpoints which you
 * already routed through Netlify (netlify.toml redirects).
 *
 * - POST /createCheckoutSession  -> returns { url } to Stripe Checkout
 * - POST /createPortalSession    -> returns { url } to Billing Portal
 *
 * No priceId is sent from the client; the function should read it from
 * server env (e.g., COLLEGE_PRICE_ID) or its own config.
 */

export default function Premium() {
  const { user } = useAuth() || {};
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function goToCheckout() {
    setErr("");
    try {
      setBusy(true);
      const res = await fetch("/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send email/uid if your function wants it (optional)
        body: JSON.stringify({ uid: user?.uid || null, email: user?.email || null }),
      });
      if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
      const data = await res.json();
      if (!data?.url) throw new Error("No redirect URL from server");
      window.location.assign(data.url);
    } catch (e) {
      console.error(e);
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setErr("");
    try {
      setBusy(true);
      const res = await fetch("/createPortalSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user?.uid || null }),
      });
      if (!res.ok) throw new Error(`Portal failed (${res.status})`);
      const data = await res.json();
      if (!data?.url) throw new Error("No portal URL from server");
      window.location.assign(data.url);
    } catch (e) {
      console.error(e);
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-3">Premium</h3>
      <div className="card shadow-sm">
        <div className="card-body">
          <p className="mb-3">
            Upgrade to unlock unlimited messages, see who liked you, and get read receipts.
          </p>

          {err && <div className="alert alert-danger py-2">{err}</div>}

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary fw-bold" onClick={goToCheckout} disabled={busy}>
              {busy ? "Preparing…" : "Upgrade"}
            </button>
            <button className="btn btn-outline-secondary" onClick={openPortal} disabled={busy}>
              Manage subscription
            </button>
          </div>

          <div className="text-muted small mt-3">
            You’ll be redirected to our secure Stripe checkout. You can cancel anytime in the billing portal.
          </div>
        </div>
      </div>
    </div>
  );
}
