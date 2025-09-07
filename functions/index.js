/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const { onUserCreated } = require("firebase-functions/v2/auth");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/** ===== Brand Config ===== */
const BRAND = "Candle Love";
const FROM_EMAIL = "infojr.83@gmail.com"; // must be verified in SendGrid
const APP_URL = process.env.APP_URL || "https://thecandlelove.com";
const LOGO_URL =
  process.env.LOGO_URL ||
  "https://cupido-2025.netlify.app/logo.png";

/** ===== Secrets ===== */
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");
const ADMIN_SEED_TOKEN = defineSecret("ADMIN_SEED_TOKEN");

/** ===== Helpers ===== */
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapHtml(title, bodyHtml) {
  const logoImg = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="${escapeHtml(
        BRAND
      )} logo" style="height:48px;margin-right:10px;border:none;" />`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;color:#1f1b16;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(180deg,#1a0f07,#2a180c);padding:18px;text-align:center;">
          ${logoImg}
          <span style="font-family:'Great Vibes',cursive;font-size:28px;font-weight:700;color:#ff9e2c;text-shadow:0 0 6px rgba(216,122,18,0.5);">${escapeHtml(
            BRAND
          )}</span>
        </td></tr>
        <tr><td style="padding:24px;font-size:16px;line-height:1.5;">${bodyHtml}
          <p style="margin-top:28px;font-size:13px;color:#6b635a;">You received this because you have a ${BRAND} account.</p>
        </td></tr>
        <tr><td style="background:#fff2e3;padding:14px;text-align:center;font-size:12px;">© ${new Date().getFullYear()} ${BRAND} • <a href="${APP_URL}" style="color:#b8742c;">Open ${BRAND}</a></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(to, subject, html, key) {
  sgMail.setApiKey(key);
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: BRAND },
    subject,
    html,
  });
}

/** ===== OTP Helpers ===== */
function code6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function hash(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

/** ===== CORS ===== */
function addCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/** ===== EDU OTP Endpoints ===== */
exports.sendEduOtp = onRequest(
  { secrets: [SENDGRID_SECRET], region: "us-central1" },
  async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email.endsWith(".edu")) {
        return res.json({ ok: false, error: "Valid .edu email required" });
      }
      const code = code6();
      const ref = db.doc(`eduOtps/${email}`);
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await ref.set({
        codeHash: hash(code),
        expiresAt,
        createdAt: Date.now(),
        attempts: 0,
      });

      let emailSent = false;
      try {
        const key = SENDGRID_SECRET.value();
        const subject = `Your ${BRAND} verification code: ${code}`;
        const html = wrapHtml(
          subject,
          `<p>Here is your verification code:</p>
          <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>This code expires in 10 minutes.</p>`
        );
        await sendEmail(email, subject, html, key);
        emailSent = true;
      } catch (e) {
        console.error("SendGrid failed:", e.message);
      }

      return res.json({
        ok: true,
        emailSent,
        message: emailSent
          ? "OTP sent. Check your inbox."
          : "OTP created (email not sent).",
      });
    } catch (err) {
      console.error("sendEduOtp error:", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }
);

exports.verifyEduOtp = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      const ref = db.doc(`eduOtps/${email}`);
      const snap = await ref.get();
      if (!snap.exists) return res.json({ ok: false, error: "No code found" });

      const data = snap.data() || {};
      if (Date.now() > Number(data.expiresAt)) {
        return res.json({ ok: false, error: "Code expired" });
      }
      if (hash(code) !== data.codeHash) {
        return res.json({ ok: false, error: "Invalid code" });
      }

      await db.doc(`verifiedEduEmails/${email}`).set(
        {
          email,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await ref.delete();
      return res.json({ ok: true });
    } catch (err) {
      console.error("verifyEduOtp error:", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  }
);

/** ===== Admin Seeding ===== */
exports.seedInitialAdmin = onRequest(
  { secrets: [ADMIN_SEED_TOKEN], region: "us-central1" },
  async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const { token, email } = req.body || {};
      const secret = ADMIN_SEED_TOKEN.value();
      if (token !== secret) return res.status(403).json({ error: "Bad token" });

      const userRecord = await auth.getUserByEmail(email);
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
      await db.doc(`users/${userRecord.uid}`).set(
        {
          roles: { admin: true },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return res.json({ ok: true, email, uid: userRecord.uid, admin: true });
    } catch (e) {
      console.error("seedInitialAdmin:", e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  }
);

/** ===== College Tagging ===== */
exports.tagCollegeOnCreate = onUserCreated({ region: "us-central1" }, async (event) => {
  try {
    const email = event.data.email?.toLowerCase();
    if (!email) return;

    const snap = await db.doc(`verifiedEduEmails/${email}`).get();
    if (!snap.exists) return;

    const domain = email.split("@")[1] || "";
    await db.doc(`users/${event.data.uid}`).set(
      {
        verification: {
          college: true,
          collegeDomain: domain,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
    await auth.setCustomUserClaims(event.data.uid, {
      eduVerified: true,
      userType: "college",
      eduDomain: domain,
    });
  } catch (e) {
    console.error("tagCollegeOnCreate error:", e);
  }
});

/** ===== Notifications (stubbed for later) ===== */
exports.onNewLike = onRequest({ region: "us-central1" }, async (req, res) => {
  res.json({ ok: true, message: "Like notification placeholder" });
});

exports.onNewMessage = onRequest({ region: "us-central1" }, async (req, res) => {
  res.json({ ok: true, message: "Message notification placeholder" });
});

exports.sendWelcomeEmail = onRequest(
  { secrets: [SENDGRID_SECRET], region: "us-central1" },
  async (req, res) => {
    addCors(res);
    try {
      const { email, name } = req.body || {};
      const key = SENDGRID_SECRET.value();
      const subject = `Welcome to ${BRAND}`;
      const html = wrapHtml(
        subject,
        `<p>Hi ${escapeHtml(name || "")}, welcome to ${BRAND}!</p>`
      );
      await sendEmail(email, subject, html, key);
      return res.json({ ok: true });
    } catch (err) {
      console.error("sendWelcomeEmail:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);
