const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { plan } = JSON.parse(event.body);

    // Replace with your real Stripe Price IDs
    const priceId =
      plan === "college"
        ? "price_123_COLLEGE"
        : "price_123_NORMAL";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_PUBLIC_URL}/success`,
      cancel_url: `${process.env.APP_PUBLIC_URL}/settings`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
