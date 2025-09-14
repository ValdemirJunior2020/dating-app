/**
 * edu.js — .edu OTP verification with SendGrid
 *
 * Endpoints:
 *  - POST /sendEduOtp   { email }
 *  - POST /verifyEduOtp { email, code }
 */
const functions = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const EDU_REGEX = /\.edu$/i;

const BRAND = process.env.APP_BRAND || "Candle Love";
const FROM_EMAIL = process.env.SENDGRID_FROM || "infojr.83@gmail.com";

const nowMs = () => Date.now();
const addMinutes = (ms, minutes) => ms + minutes * 60 * 1000;
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

async function saveOtp(email, code) {
  const key = email.toLowerCase();
  const expiresAt = addMinutes(nowMs(), OTP_TTL_MINUTES);
  await db.collection("eduOtps").doc(key).set({
    email: key,
    codePlain: code,
    attempts: 0,
    expiresAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
async function getOtp(email) {
  const snap = await db.collection("eduOtps").doc(email.toLowerCase()).get();
  return snap.exists ? snap.data() : null;
}
async function bumpAttempts(email) {
  await db.collection("eduOtps").doc(email.toLowerCase()).update({
    attempts: admin.firestore.FieldValue.increment(1),
    lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
async function clearOtp(email) {
  await db.collection("eduOtps").doc(email.toLowerCase()).delete();
}
async function markVerified(email) {
  await db.collection("verifiedEduEmails").doc(email.toLowerCase()).set({
    email: email.toLowerCase(),
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    type: "edu",
  });
}
async function alreadyVerified(email) {
  const snap = await db.collection("verifiedEduEmails").doc(email.toLowerCase()).get();
  return snap.exists;
}
function addCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

async function sendOtpEmail(to, code) {
  const key = SENDGRID_SECRET.value();
  if (!key) throw new Error("Missing SENDGRID_API_KEY secret");
  sgMail.setApiKey(key);

  const subject = `Your ${BRAND} verification code`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Verify your college email</h2>
      <p>Use this code to verify your <b>.edu</b> email:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0">${code}</div>
      <p>This code expires in <b>${OTP_TTL_MINUTES} minutes</b>.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <p style="font-size:12px;color:#666">If you didn’t request this, ignore this email.</p>
    </div>
  `;
  await sgMail.send({ to, from: FROM_EMAIL, subject, html });
}

const sendEduOtp = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .https.onRequest(async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const { email } = req.body || {};
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: "Valid email required" });
      }
      if (!EDU_REGEX.test(email)) {
        return res.status(400).json({ ok: false, error: "Only .edu emails are allowed" });
      }
      if (await alreadyVerified(email)) {
        return res.status(200).json({ ok: true, alreadyVerified: true });
      }

      const code = genCode();
      await saveOtp(email, code);

      let emailSent = true;
      try {
        await sendOtpEmail(email, code);
      } catch (e) {
        emailSent = false;
        console.error("SendGrid error during sendOtpEmail:", e?.response?.body || e?.message || e);
      }

      return res.status(200).json({
        ok: true,
        message: emailSent ? "OTP sent" : "OTP created (email not sent; provisioning).",
        emailSent,
      });
    } catch (err) {
      console.error("sendEduOtp:", err);
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  });

const verifyEduOtp = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .https.onRequest(async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const { email, code } = req.body || {};
      if (!email || !/^\d{6}$/.test(code || "")) {
        return res.status(400).json({ ok: false, error: "Email and 6-digit code required" });
      }

      const record = await getOtp(email);
      if (!record) return res.status(400).json({ ok: false, error: "No OTP found." });

      if ((record.attempts || 0) >= MAX_ATTEMPTS) {
        await clearOtp(email);
        return res.status(429).json({ ok: false, error: "Too many attempts." });
      }

      if (nowMs() > Number(record.expiresAt)) {
        await clearOtp(email);
        return res.status(400).json({ ok: false, error: "Code expired." });
      }

      if (code !== record.codePlain) {
        await bumpAttempts(email);
        return res.status(400).json({ ok: false, error: "Invalid code." });
      }

      await markVerified(email);
      await clearOtp(email);
      return res.status(200).json({ ok: true, verified: true });
    } catch (err) {
      console.error("verifyEduOtp:", err);
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  });

module.exports = { sendEduOtp, verifyEduOtp };
