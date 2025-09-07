/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const { defineSecret } = require("firebase-functions/params");

require("dotenv").config();
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/** ===== Brand config ===== */
const BRAND = "Candle Love";
const FROM_EMAIL = "infojr.83@gmail.com"; // must be verified in SendGrid
const APP_URL = process.env.APP_URL || "https://thecandlelove.com";
const LOGO_URL = process.env.LOGO_URL || "https://cupido-2025.netlify.app/logo.png";

/** ===== Secrets ===== */
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");
function getSendgridKey() {
  const envVal = process.env.SENDGRID_API_KEY;
  return SENDGRID_SECRET.value() || envVal;
}

/** ===== Helpers ===== */
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapHtml(title, bodyHtml) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;border:1px solid #eee;padding:20px;border-radius:8px;">
      <h2 style="color:#ff9e2c;font-family:'Great Vibes',cursive">${escapeHtml(
        BRAND
      )}</h2>
      ${bodyHtml}
      <hr/>
      <p style="font-size:12px;color:#777">© ${new Date().getFullYear()} ${BRAND} • <a href="${APP_URL}">Visit site</a></p>
    </div>
  </body></html>`;
}

async function sendEmail(to, subject, html) {
  const key = getSendgridKey();
  sgMail.setApiKey(key);
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: BRAND },
    subject,
    html,
    replyTo: FROM_EMAIL,
  });
}

/** ===== OTP helpers ===== */
function code6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function hash(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

/** ===== CORS helper ===== */
function corsWrap(handler) {
  return async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    return handler(req, res);
  };
}

/** ===== OTP Endpoints ===== */
exports.sendEduOtp = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .https.onRequest(
    corsWrap(async (req, res) => {
      try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!email || !email.endsWith(".edu"))
          return res.json({ ok: false, error: "Valid .edu email required" });

        const code = code6();
        const ref = admin.firestore().doc(`eduOtps/${email}`);
        const expiresAt = Date.now() + 10 * 60 * 1000;
        await ref.set({
          codeHash: hash(code),
          expiresAt,
          createdAt: Date.now(),
          attempts: 0,
        });

        // Send email
        let emailSent = false;
        try {
          const key = getSendgridKey();
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
          console.error("sendEduOtp email:", e.message);
        }

        return res.json({
          ok: true,
          emailSent,
          message: emailSent
            ? "OTP sent. Check your inbox."
            : "OTP created (email not sent; check Firestore).",
        });
      } catch (e) {
        console.error("sendEduOtp:", e);
        return res.status(500).json({ ok: false, error: "Server error" });
      }
    })
  );

exports.verifyEduOtp = functions.https.onRequest(
  corsWrap(async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      if (!email || !/^[0-9]{6}$/.test(code))
        return res.json({ ok: false, error: "Email and 6-digit code required" });

      const ref = admin.firestore().doc(`eduOtps/${email}`);
      const snap = await ref.get();
      if (!snap.exists)
        return res.json({ ok: false, error: "No code found. Request new one." });

      const data = snap.data() || {};
      if (Date.now() > Number(data.expiresAt || 0))
        return res.json({ ok: false, error: "Code expired." });
      if (hash(code) !== data.codeHash)
        return res.json({ ok: false, error: "Invalid code." });

      // Mark verified
      await admin.firestore().doc(`verifiedEduEmails/${email}`).set(
        {
          email,
          type: "edu",
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await ref.delete();
      return res.json({ ok: true });
    } catch (e) {
      console.error("verifyEduOtp:", e);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  })
);

/** ===== New: Welcome Email ===== */
exports.sendWelcomeEmail = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .auth.user()
  .onCreate(async (user) => {
    if (!user.email) return;
    const subject = `Welcome to ${BRAND} 💕`;
    const html = wrapHtml(
      subject,
      `<p>Hi ${escapeHtml(user.displayName || "there")},</p>
       <p>Welcome to ${BRAND}! We're excited to have you here.</p>
       <a href="${APP_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#ff9e2c;color:#fff;text-decoration:none;border-radius:6px;">Get Started</a>`
    );
    try {
      await sendEmail(user.email, subject, html);
      console.log("Welcome email sent:", user.email);
    } catch (e) {
      console.error("sendWelcomeEmail error:", e);
    }
  });

/** ===== New: Like Notification ===== */
exports.sendLikeNotification = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("likes/{likeId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data?.toUser) return;

    const userDoc = await db.doc(`users/${data.toUser}`).get();
    if (!userDoc.exists) return;
    const toUser = userDoc.data();
    if (!toUser?.email) return;

    const subject = `Someone liked your photo on ${BRAND} 💖`;
    const html = wrapHtml(
      subject,
      `<p>Good news! Someone liked your photo. Log in to see who 😉</p>
       <a href="${APP_URL}/matches" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#ff9e2c;color:#fff;text-decoration:none;border-radius:6px;">View Likes</a>`
    );
    try {
      await sendEmail(toUser.email, subject, html);
      console.log("Like email sent:", toUser.email);
    } catch (e) {
      console.error("sendLikeNotification error:", e);
    }
  });

/** ===== New: Message Notification ===== */
exports.sendMessageNotification = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("messages/{chatId}/{msgId}")
  .onCreate(async (snap) => {
    const msg = snap.data();
    if (!msg?.toUser) return;

    const userDoc = await db.doc(`users/${msg.toUser}`).get();
    if (!userDoc.exists) return;
    const toUser = userDoc.data();
    if (!toUser?.email) return;

    const subject = `New message on ${BRAND} 💌`;
    const html = wrapHtml(
      subject,
      `<p>You received a new message:</p>
       <blockquote style="margin:12px 0;padding:10px;background:#f9f9f9;border-left:4px solid #ff9e2c;">${escapeHtml(
         msg.text || ""
       )}</blockquote>
       <a href="${APP_URL}/chat" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#ff9e2c;color:#fff;text-decoration:none;border-radius:6px;">Open Chat</a>`
    );
    try {
      await sendEmail(toUser.email, subject, html);
      console.log("Message email sent:", toUser.email);
    } catch (e) {
      console.error("sendMessageNotification error:", e);
    }
  });
