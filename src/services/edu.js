// src/services/edu.js
const REGION_BASE = "https://us-central1-review-45013.cloudfunctions.net";
const BASE =
  process.env.REACT_APP_FUNCTIONS_BASE ||
  REGION_BASE; // change via env if you proxy through Netlify

export async function sendEduOtp(email) {
  const res = await fetch(`${BASE}/sendEduOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyEduOtp(email, code) {
  const res = await fetch(`${BASE}/verifyEduOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
}
