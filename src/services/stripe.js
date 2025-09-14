// src/services/stripe.js
import { loadStripe } from "@stripe/stripe-js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Cached config */
let _cfg = null;
let _stripe = null;

/** Normalize boolean-ish */
const asBool = (v, d = false) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  if (typeof v === "number") return v !== 0;
  return d;
};

/** Read /config/app and derive billingEnabled */
export async function getStripeConfig() {
  if (_cfg) return _cfg;

  // Read Firestore config (optional)
  let stripeCfg = {};
  try {
    const s = await getDoc(doc(db, "config", "app"));
    stripeCfg = s.exists() ? s.data()?.stripe || {} : {};
  } catch (_) {}

  // Env overrides (handy on Netlify / Vercel)
  const publishableKey =
    stripeCfg.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  const priceMonthly = stripeCfg.priceMonthly || "";
  const priceYearly = stripeCfg.priceYearly || "";

  // Checkout + Portal function endpoints
  const functionUrl =
    stripeCfg.functionUrl || import.meta.env.VITE_STRIPE_FUNCTION_URL || "/createCheckoutSession";
  const portalFunctionUrl =
    stripeCfg.portalFunctionUrl ||
    import.meta.env.VITE_STRIPE_PORTAL_FUNCTION_URL ||
    "/createPortalSession";

  const successUrl =
    stripeCfg.successUrl ||
    (typeof window !== "undefined" ? window.location.origin + "/premium?ok=1" : "");
  const cancelUrl =
    stripeCfg.cancelUrl ||
    (typeof window !== "undefined" ? window.location.origin + "/premium?canceled=1" : "");

  // Billing enabled if keys & at least one price exist
  const billingEnabled =
    asBool(stripeCfg.enabled, true) &&
    !!publishableKey &&
    !!functionUrl &&
    !!portalFunctionUrl &&
    !!(priceMonthly || priceYearly);

  _cfg = {
    billingEnabled,
    publishableKey,
    priceMonthly,
    priceYearly,
    functionUrl,
    portalFunctionUrl,
    successUrl,
    cancelUrl,
  };
  return _cfg;
}

async function getStripe() {
  const cfg = await getStripeConfig();
  if (!cfg.billingEnabled) return null;
  if (!_stripe) _stripe = await loadStripe(cfg.publishableKey);
  return _stripe;
}

/** Returns false if billing is disabled right now */
export async function isBillingEnabled() {
  const cfg = await getStripeConfig();
  return !!cfg.billingEnabled;
}

/** Start Checkout; if disabled, throw a friendly error the UI can handle */
export async function checkout(plan = "monthly") {
  const cfg = await getStripeConfig();
  if (!cfg.billingEnabled) {
    const err = new Error("Billing disabled");
    err.code = "BILLING_DISABLED";
    throw err;
  }

  const stripe = await getStripe();
  if (!stripe) {
    const err = new Error("Stripe not ready");
    err.code = "BILLING_DISABLED";
    throw err;
  }

  const priceId = plan === "yearly" ? cfg.priceYearly : cfg.priceMonthly;
  if (!priceId) {
    const err = new Error("Price ID missing");
    err.code = "BILLING_DISABLED";
    throw err;
  }

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
  window.location.href = data.url;
}

/** Open Stripe Customer Portal */
export async function openPortal(returnUrl) {
  const cfg = await getStripeConfig();
  if (!cfg.billingEnabled) {
    const err = new Error("Billing disabled");
    err.code = "BILLING_DISABLED";
    throw err;
  }

  const res = await fetch(cfg.portalFunctionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({
      returnUrl: returnUrl || (typeof window !== "undefined" ? window.location.origin + "/premium" : ""),
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Portal failed (${res.status}) ${t}`);
  }

  const data = await res.json();
  if (!data?.url) throw new Error("No portal URL");
  window.location.href = data.url;
}
