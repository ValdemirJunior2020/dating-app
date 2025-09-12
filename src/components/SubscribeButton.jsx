import React from "react";

export default function SubscribeButton({ plan }) {
  const handleSubscribe = async () => {
    try {
      const res = await fetch("/.netlify/functions/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }), // plan = "college" or "normal"
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        alert("Something went wrong: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleSubscribe}>
      Subscribe ({plan})
    </button>
  );
}
