const res = await fetch("/.netlify/functions/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    priceId,
    customerEmail: user?.email || "test@example.com",
  }),
});
