// src/services/stripe.js
// Stripe Checkout via server-created URL (no @stripe/stripe-js import needed)
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Cached config */
let _cfg = null;

/** Fetch /config/app once and cache */
export async function getStripeConfig() {
  if (_cfg) return _cfg;
  const s = await getDoc(doc(db, "config", "app"));
  const d = s.exists() ? s.data() : {};
  const V = (k) =>
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[k]) ||
    (typeof process !== "undefined" && process.env && process.env[k]) ||
    "";

  _cfg = {
    publishableKey:
      d?.stripe?.publishableKey || V("VITE_STRIPE_PUBLISHABLE_KEY") || V("REACT_APP_STRIPE_PUBLISHABLE_KEY") || "",
    priceMonthly: d?.stripe?.priceMonthly || "",
    priceYearly: d?.stripe?.priceYearly || "",
    successUrl:
      d?.stripe?.successUrl ||
      (typeof window !== "undefined" ? window.location.origin + "/premium?ok=1" : ""),
    cancelUrl:
      d?.stripe?.cancelUrl ||
      (typeof window !== "undefined" ? window.location.origin + "/premium?canceled=1" : ""),
    // your backend or Cloud Function endpoint that returns { url } for Checkout
    functionUrl: d?.stripe?.functionUrl || V("VITE_STRIPE_FUNCTION_URL") || "/createCheckoutSession",
  };
  return _cfg;
}

/**
 * Start Stripe Checkout for 'monthly' | 'yearly'
 * Backend must create a Checkout Session and return { url }.
 * No @stripe/stripe-js required; we redirect to the hosted page.
 */
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
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Checkout failed (${res.status}) ${t}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!data?.url) throw new Error("No checkout URL from server");
  if (typeof window !== "undefined") window.location.href = data.url;
}
