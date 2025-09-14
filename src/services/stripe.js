// src/services/stripe.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

let _cfg = null;

export async function getStripeConfig() {
  if (_cfg) return _cfg;
  const snap = await getDoc(doc(db, "config", "app"));
  const d = snap.exists() ? snap.data() : {};
  const V = (k) =>
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[k]) ||
    (typeof process !== "undefined" && process.env && process.env[k]) ||
    "";

  _cfg = {
    publishableKey:
      d?.stripe?.publishableKey ||
      V("VITE_STRIPE_PUBLISHABLE_KEY") ||
      V("REACT_APP_STRIPE_PUBLISHABLE_KEY") ||
      "",
    priceMonthly: d?.stripe?.priceMonthly || V("VITE_PRICE_MONTHLY") || "",
    priceYearly: d?.stripe?.priceYearly || V("VITE_PRICE_YEARLY") || "",
    successUrl:
      d?.stripe?.successUrl ||
      (typeof window !== "undefined" ? window.location.origin + "/premium?ok=1" : ""),
    cancelUrl:
      d?.stripe?.cancelUrl ||
      (typeof window !== "undefined" ? window.location.origin + "/premium?canceled=1" : ""),
    // 👇 Default to Netlify Functions path
    functionUrl:
      d?.stripe?.functionUrl ||
      V("VITE_STRIPE_FUNCTION_URL") ||
      "/.netlify/functions/create-checkout-session",
  };
  return _cfg;
}

export async function checkout(plan = "monthly") {
  const cfg = await getStripeConfig();
  const priceId = plan === "yearly" ? cfg.priceYearly : cfg.priceMonthly;
  if (!priceId) throw new Error("Stripe price not configured");

  const res = await fetch(cfg.functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({
      priceId,
      successUrl: cfg.successUrl,
      cancelUrl: cfg.cancelUrl,
      mode: "subscription",
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Checkout failed (${res.status}) ${t}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.url) throw new Error("No checkout URL from server");
  window.location.href = data.url;
}
