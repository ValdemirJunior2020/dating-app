// functions/stripe.js
// Secrets to set (once):
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//
// If you call these endpoints from the client with Firebase Auth,
// include an ID token:  Authorization: Bearer <ID_TOKEN>

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

function addCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function getUidFromRequest(req) {
  try {
    const h = String(req.get("Authorization") || "");
    if (h.startsWith("Bearer ")) {
      const token = h.slice(7).trim();
      const decoded = await auth.verifyIdToken(token);
      return decoded.uid || null;
    }
  } catch (_) {}
  // dev fallback (optional): accept uid in body
  if (req?.body?.uid && typeof req.body.uid === "string") return req.body.uid;
  return null;
}

async function getOrCreateCustomer(uid) {
  if (!uid) return null;
  const ref = db.doc(`stripe_customers/${uid}`);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.customerId) return snap.data().customerId;

  // create a customer (attach email if we can)
  let email = null;
  try {
    const u = await auth.getUser(uid);
    email = u.email || null;
  } catch (_) {}

  const stripe = new Stripe(STRIPE_SECRET_KEY.value());
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { firebaseUid: uid },
  });

  await ref.set(
    {
      customerId: customer.id,
      email: email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customer.id;
}

/**
 * POST /createCheckoutSession
 * body: { priceId, successUrl?, cancelUrl?, uid? }
 * returns: { url }
 */
const createCheckoutSession = onRequest({ secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  addCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { priceId, successUrl, cancelUrl } = req.body || {};
    if (!priceId) return res.status(400).json({ error: "Missing priceId" });

    const uid = await getUidFromRequest(req); // may be null if not signed
    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    let params = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: successUrl || "https://example.com/premium?ok=1",
      cancel_url: cancelUrl || "https://example.com/premium?canceled=1",
    };

    if (uid) {
      const customerId = await getOrCreateCustomer(uid);
      params.customer = customerId;
      params.metadata = { firebaseUid: uid };
    }

    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("createCheckoutSession:", err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

/**
 * POST /createPortalSession
 * body: { returnUrl?, uid? }
 * returns: { url }
 */
const createPortalSession = onRequest({ secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
  addCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const uid = await getUidFromRequest(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { returnUrl } = req.body || {};
    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    const customerId = await getOrCreateCustomer(uid);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || "https://example.com/premium",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("createPortalSession:", err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = { createCheckoutSession, createPortalSession };
