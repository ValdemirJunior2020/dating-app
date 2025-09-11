const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { plan } = JSON.parse(event.body); // plan = "college" or "normal"

    let priceId;

    // Use your Stripe Price IDs from your Stripe Dashboard
    if (plan === "college") {
      priceId = "price_123_college"; // replace with real Stripe price ID
    } else if (plan === "normal") {
      priceId = "price_123_normal"; // replace with real Stripe price ID
    } else {
      return { statusCode: 400, body: "Invalid plan" };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/success`,
      cancel_url: `${process.env.URL}/cancel`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
