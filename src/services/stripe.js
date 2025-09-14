// src/services/stripe.js
import { loadStripe } from "@stripe/stripe-js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Cached config */
let _cfg = null;
let _stripe = null;

/** Fetch /config/app once and cache */
export async function getStripeConfig() {
  if (_cfg) return _cfg;
  const s = await getDoc(doc(db, "config", "app"));
  const d = s.exists() ? s.data() : {};
  _cfg = {
    publishableKey: d?.stripe?.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
    priceMonthly: d?.stripe?.priceMonthly || "",
    priceYearly: d?.stripe?.priceYearly || "",
    successUrl:
      d?.stripe?.successUrl || (typeof window !== "undefined" ? window.location.origin + "/premium?ok=1" : ""),
    cancelUrl:
      d?.stripe?.cancelUrl || (typeof window !== "undefined" ? window.location.origin + "/premium?canceled=1" : ""),
    // optional override for function endpoint
    functionUrl:
      d?.stripe?.functionUrl || import.meta.env.VITE_STRIPE_FUNCTION_URL || "/createCheckoutSession",
  };
  return _cfg;
}

/** Ensure Stripe JS instance */
async function getStripe() {
  const cfg = await getStripeConfig();
  if (!_stripe) _stripe = await loadStripe(cfg.publishableKey);
  return _stripe;
}

/**
 * Start Stripe Checkout for 'monthly' | 'yearly'
 * Requires Cloud Function createCheckoutSession (provided below).
 */
export async function checkout(plan = "monthly") {
  const cfg = await getStripeConfig();
  const stripe = await getStripe();

  const priceId =
    plan === "yearly" ? cfg.priceYearly : cfg.priceMonthly;

  if (!stripe || !priceId) throw new Error("Stripe not configured");

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
  const data = await res.json();
  if (!data?.url) throw new Error("No checkout URL");
  window.location.href = data.url; // redirect to Stripe Checkout
}
