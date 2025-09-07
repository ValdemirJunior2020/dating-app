/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const { defineSecret } = require("firebase-functions/params");

require("dotenv").config();
admin.initializeApp();

/** ===== Brand config ===== */
const BRAND = "Candle Love";
const FROM_EMAIL = "infojr.83@gmail.com"; // must be verified in SendGrid
const APP_URL = process.env.APP_URL || "https://thecandlelove.com";
const LOGO_URL = process.env.LOGO_URL || "https://cupido-2025.netlify.app/logo.png";

/** ===== Secrets ===== */
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");
function getSendgridKey() {
  const secretVal = typeof SENDGRID_SECRET.value === "function" ? SENDGRID_SECRET.value() : undefined;
  const envVal = process.env.SENDGRID_API_KEY;
  const key = secretVal || envVal;
  if (!key) throw new Error("Missing SENDGRID_API_KEY");
  return key;
}

/** ===== CORS helper (for fetch from your web app) ===== */
function corsWrap(handler) {
  return async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    return handler(req, res);
  };
}

/** ===== Email wrapper ===== */
function escapeHtml(s = "") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function wrapHtml(title, bodyHtml) {
  const logoImg = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="${escapeHtml(BRAND)} logo" style="height:48px;vertical-align:middle;margin-right:10px;border:none;outline:none;text-decoration:none;display:inline-block;" />`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e6da;">
        <tr><td style="background:#1a0f07;background:linear-gradient(180deg,#1a0f07,#2a180c);padding:18px 24px;text-align:center;">
          ${logoImg}
          <span style="font-family:'Great Vibes','Brush Script MT','Segoe Script',cursive;font-size:28px;font-weight:700;color:#ff9e2c;text-shadow:0 0 6px rgba(216,122,18,0.5);vertical-align:middle;">${escapeHtml(BRAND)}</span>
        </td></tr>
        <tr><td style="padding:24px;font-size:16px;line-height:1.5;color:#1f1b16;">${bodyHtml}
          <p style="margin-top:28px;font-size:13px;color:#6b635a;">You received this because you have a ${escapeHtml(BRAND)} account.</p>
        </td></tr>
        <tr><td style="background:#fff2e3;color:#4a3a2f;padding:14px 24px;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ${escapeHtml(BRAND)} • <a href="${APP_URL}" style="color:#b8742c;text-decoration:none;">Open ${escapeHtml(BRAND)}</a></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
async function sendEmail(to, subject, html, key) {
  sgMail.setApiKey(key);
  await sgMail.send({ to, from: { email: FROM_EMAIL, name: BRAND }, subject, html, replyTo: FROM_EMAIL });
}

/** ===== OTP helpers ===== */
function code6() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function hash(s) { return crypto.createHash("sha256").update(String(s)).digest("hex"); }

/** 
 * POST /sendEduOtp  { email }
 * Stores a hashed code in eduOtps/{email}, TTL 10 minutes, emails the code via SendGrid.
 */
exports.sendEduOtp = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .https.onRequest(corsWrap(async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email || !email.endsWith(".edu")) return res.json({ ok: false, error: "Valid .edu email required" });

      const code = code6();
      const ref = admin.firestore().doc(`eduOtps/${email}`);
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await ref.set({ codeHash: hash(code), expiresAt, createdAt: Date.now(), attempts: 0 });

      // Send email
      let emailSent = false;
      try {
        const key = getSendgridKey();
        const subject = `Your ${BRAND} verification code: ${code}`;
        const html = wrapHtml(subject, `<p>Here is your verification code:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>This code expires in 10 minutes.</p>`);
        await sendEmail(email, subject, html, key);
        emailSent = true;
      } catch (e) {
        console.error("sendEduOtp email:", e.message);
      }

      return res.json({
        ok: true,
        emailSent,
        message: emailSent
          ? "OTP sent. Check your inbox."
          : "OTP created (email not sent; provider provisioning). Ask admin for the code in Firestore.",
      });
    } catch (e) {
      console.error("sendEduOtp:", e);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }));

/**
 * POST /verifyEduOtp  { email, code }
 * Verifies the code and writes verifiedEduEmails/{email}.
 * If an Authorization header contains a Firebase ID token, we also mark users/{uid}.
 */
exports.verifyEduOtp = functions.https.onRequest(corsWrap(async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!email || !/^[0-9]{6}$/.test(code)) return res.json({ ok: false, error: "Email and 6-digit code required" });

    const ref = admin.firestore().doc(`eduOtps/${email}`);
    const snap = await ref.get();
    if (!snap.exists) return res.json({ ok: false, error: "No code found. Please request a new one." });

    const data = snap.data() || {};
    if (Date.now() > Number(data.expiresAt || 0)) return res.json({ ok: false, error: "Code expired. Request a new one." });
    if (hash(code) !== data.codeHash) return res.json({ ok: false, error: "Invalid code." });

    // Mark verified
    await admin.firestore().doc(`verifiedEduEmails/${email}`).set({
      email, type: "edu", verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // If caller sent a Firebase ID token, try to mark their user doc too
    try {
      const authz = String(req.headers.authorization || "");
      const idToken = authz.startsWith("Bearer ") ? authz.substring(7) : null;
      if (idToken) {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const uid = decoded.uid;
        await admin.firestore().doc(`users/${uid}`).set({
          eduVerified: true, verification: { college: true }, updatedAt: Date.now(),
        }, { merge: true });
      }
    } catch (e) { /* not fatal */ }

    await ref.delete();
    return res.json({ ok: true });
  } catch (e) {
    console.error("verifyEduOtp:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}));
