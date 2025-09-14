// netlify/functions/create-checkout-session.js
// Requires env var STRIPE_SECRET_KEY set in Netlify site settings

const Stripe = require("stripe");

function addCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.handler = async (event) => {
  try {
    addCors({
      setHeader: (k, v) => (event.multiValueHeaders ??= {}, event.headers ??= {}, null),
    });
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" }, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: { "Access-Control-Allow-Origin": "*" }, body: "Use POST" };
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: "Missing STRIPE_SECRET_KEY" };
    }

    const payload = JSON.parse(event.body || "{}");
    const { priceId, successUrl, cancelUrl } = payload;
    if (!priceId) {
      return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: "Missing priceId" };
    }

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: successUrl || `${process.env.APP_URL || "https://example.com"}/premium?ok=1`,
      cancel_url: cancelUrl || `${process.env.APP_URL || "https://example.com"}/premium?canceled=1`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" },
      body: `Checkout error: ${err.message || String(err)}`,
    };
  }
};
