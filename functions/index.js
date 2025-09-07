/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const { defineSecret } = require("firebase-functions/params");

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
  const secretVal = typeof SENDGRID_SECRET.value === "function" ? SENDGRID_SECRET.value() : undefined;
  const key = secretVal || envVal;
  if (!key) throw new Error("Missing SENDGRID_API_KEY");
  return key;
}

/** ===== Email wrapper ===== */
function escapeHtml(s = "") {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function wrapHtml(title, bodyHtml) {
  const logoImg = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="${escapeHtml(BRAND)} logo" style="height:48px;vertical-align:middle;margin-right:10px;" />`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e6da;">
        <tr><td style="background:#1a0f07;padding:18px 24px;text-align:center;">
          ${logoImg}
          <span style="font-family:'Great Vibes',cursive;font-size:28px;font-weight:700;color:#ff9e2c;text-shadow:0 0 6px rgba(216,122,18,0.5);">${escapeHtml(BRAND)}</span>
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

/** ===== Triggers ===== */

// Welcome email
exports.sendWelcomeEmail = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .auth.user()
  .onCreate(async (user) => {
    try {
      if (!user.email) return;
      const key = getSendgridKey();
      const subject = `Welcome to ${BRAND}, ${user.displayName || ""}`;
      const html = wrapHtml(subject, `<p>Welcome to ${BRAND}!</p>
        <p>We’re glad you joined. Set up your profile and start connecting today.</p>`);
      await sendEmail(user.email, subject, html, key);
      console.log("Welcome email sent to", user.email);
    } catch (e) {
      console.error("sendWelcomeEmail:", e.message);
    }
  });

// Like notification
exports.onNewLike = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("likes/{likeId}")
  .onCreate(async (snap) => {
    try {
      const data = snap.data();
      const { senderUid, recipientUid } = data || {};
      if (!recipientUid || senderUid === recipientUid) return;

      const recipient = await admin.auth().getUser(recipientUid);
      if (!recipient.email) return;

      const key = getSendgridKey();
      const subject = `Someone liked your photo on ${BRAND}`;
      const html = wrapHtml(subject, `<p>Good news! Another member liked your photo.</p>
        <p><a href="${APP_URL}/matches" style="color:#d87a12;">See who liked you</a></p>`);
      await sendEmail(recipient.email, subject, html, key);
      console.log("Like email sent to", recipient.email);
    } catch (e) {
      console.error("onNewLike:", e.message);
    }
  });

// Message notification
exports.onNewMessage = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("messages/{chatId}/{messageId}")
  .onCreate(async (snap) => {
    try {
      const data = snap.data();
      const { senderUid, recipientUid, text } = data || {};
      if (!recipientUid || senderUid === recipientUid) return;

      const recipient = await admin.auth().getUser(recipientUid);
      if (!recipient.email) return;

      const key = getSendgridKey();
      const subject = `New message on ${BRAND}`;
      const html = wrapHtml(subject, `<p>You’ve got a new message:</p>
        <blockquote style="margin:16px 0;padding:12px;background:#faf0e3;border-left:4px solid #ff9e2c;">${escapeHtml(text || "")}</blockquote>
        <p><a href="${APP_URL}/chat/with/${senderUid}" style="color:#d87a12;">Reply now</a></p>`);
      await sendEmail(recipient.email, subject, html, key);
      console.log("Message email sent to", recipient.email);
    } catch (e) {
      console.error("onNewMessage:", e.message);
    }
  });
