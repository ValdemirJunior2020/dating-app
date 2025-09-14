// netlify/functions/create-checkout-session.js
// Server-side Stripe Checkout creator for Netlify Functions

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/** Helper to pick a base URL for redirects */
function getBaseUrl(eventBody) {
  try {
    const body = JSON.parse(eventBody || "{}");
    if (body.successUrl) return new URL(body.successUrl).origin;
  } catch (_) {}
  return (
    process.env.APP_PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.URL || // Netlify site URL
    "http://localhost:8888"
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Accept price from body or fall back to env
    const priceId =
      body.priceId ||
      process.env.COLLEGE_PRICE_ID || // your env fallback
      null;

    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY" };
    }
    if (!priceId) {
      return { statusCode: 400, body: "Missing priceId" };
    }

    const mode = body.mode || "subscription"; // or 'payment'
    const base = getBaseUrl(event.body);
    const successUrl = body.successUrl || `${base}/premium?ok=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${base}/premium?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      // Optional: identify the user or build webhooks later
      // client_reference_id: body.uid || undefined,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url, id: session.id }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: `Error: ${err.message || err}` };
    }
};
