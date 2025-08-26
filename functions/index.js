/* eslint-disable linebreak-style, max-len, require-jsdoc, object-curly-spacing, comma-dangle, indent, no-empty */
/**
 * Candle Love — transactional emails via SendGrid
 * Triggers:
 *  - Welcome on Auth user creation
 *  - Like on Firestore: likes/{likeId}
 *  - Message on Firestore: chats/{matchId}/messages/{messageId}
 *
 * Sender: infojr.83@gmail.com (verify in SendGrid → Single Sender or Domain Auth)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { defineSecret } = require("firebase-functions/params");

// Load local env in emulator/local runs (functions/.env)
require("dotenv").config();

admin.initializeApp();

/** ===== App config (edit these) ===== */
const BRAND = "Candle Love";
const FROM_EMAIL = "infojr.83@gmail.com";  // MUST be verified in SendGrid
// Public site URL (used for buttons/links). Can be overridden by env APP_URL.
const APP_URL = process.env.APP_URL || "http://localhost:3000";
// Public absolute URL to your logo (emails need an ABSOLUTE URL, not a relative path).
// Example if hosted on Netlify: https://your-site.netlify.app/logo.png
const LOGO_URL = process.env.LOGO_URL || "https://cupido-2025.netlify.app/logo.png";

/** ===== API key sources (priority order) =====
 * 1) Firebase Secret SENDGRID_API_KEY (Console → Build → Functions → Secrets)
 * 2) Environment variable SENDGRID_API_KEY (functions/.env for local dev)
 * (Never hard-code secrets in code)
 */
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");

function getSendgridKey() {
  const secretVal = typeof SENDGRID_SECRET.value === "function" ? SENDGRID_SECRET.value() : undefined;
  const envVal = process.env.SENDGRID_API_KEY;
  const key = secretVal || envVal;
  if (!key) {
    throw new Error(
      'Missing SendGrid key. Provide one via:\n' +
      '  • Firebase Secret: SENDGRID_API_KEY (recommended for production)\n' +
      '  • functions/.env with SENDGRID_API_KEY=YOUR_KEY for local dev'
    );
  }
  return key;
}

/** ===== Utilities ===== */
function escapeHtml(s) {
  s = s == null ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Email HTML wrapper with brand header:
 * - Shows logo (LOGO_URL) + “Candle Love” in cursive amber
 * - Fully inline styles for broad email client support
 */
function wrapHtml(title, bodyHtml) {
  // Fallback to text brand if logo is not configured
  const logoImg = LOGO_URL
    ? '<img src="' + LOGO_URL + '" alt="' + escapeHtml(BRAND) + ' logo" style="height:48px;vertical-align:middle;margin-right:10px;border:none;outline:none;text-decoration:none;display:inline-block;" />'
    : "";

  return (
    "<!doctype html><html><head>" +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>" + escapeHtml(title) + "</title>" +
    "</head>" +
    '<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">' +
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;padding:24px 0;">' +
        "<tr><td align=\"center\">" +
          '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e6da;">' +

            // Header
            "<tr><td style=\"background:#1a0f07;background:linear-gradient(180deg,#1a0f07,#2a180c);padding:18px 24px;text-align:center;\">" +
              logoImg +
              // Cursive amber brand — web fonts are unreliable in email,
              // so we specify font-family with script fallbacks.
              '<span style="font-family:\'Great Vibes\',\'Brush Script MT\',\'Segoe Script\',cursive;font-size:28px;font-weight:700;color:#ff9e2c;text-shadow:0 0 6px rgba(216,122,18,0.5);vertical-align:middle;">' +
                escapeHtml(BRAND) +
              "</span>" +
            "</td></tr>" +

            // Body
            "<tr><td style=\"padding:24px;font-size:16px;line-height:1.5;color:#1f1b16;\">" +
              bodyHtml +
              '<p style="margin-top:28px;font-size:13px;color:#6b635a;">' +
                "You received this because you have a " + escapeHtml(BRAND) + " account." +
              "</p>" +
            "</td></tr>" +

            // Footer
            "<tr><td style=\"background:#fff2e3;color:#4a3a2f;padding:14px 24px;font-size:12px;text-align:center;\">" +
              "© " + new Date().getFullYear() + " " + escapeHtml(BRAND) + " • " +
              '<a href="' + APP_URL + '" style="color:#b8742c;text-decoration:none;">Open ' + escapeHtml(BRAND) + "</a>" +
            "</td></tr>" +

          "</table>" +
        "</td></tr>" +
      "</table>" +
    "</body></html>"
  );
}

function otherUidFromMatch(matchId, me) {
  matchId = String(matchId || "");
  const parts = matchId.split("_");
  const a = parts[0] || "";
  const b = parts[1] || "";
  return a === me ? b : a;
}

async function getUserContact(uid) {
  if (!uid) return { email: null, name: "there" };

  let email = null;
  let name = "there";

  try {
    const rec = await admin.auth().getUser(uid);
    email = rec.email || email;
    name = rec.displayName || name;
  } catch (e) {}

  if (!email || !name) {
    const doc = await admin.firestore().doc("users/" + uid).get();
    if (doc.exists) {
      const d = doc.data() || {};
      email = email || d.email || null;
      name = name || d.displayName || d.name || "there";
    }
  }
  return { email, name };
}

async function isAllowedByPrefs(uid, key) {
  try {
    const doc = await admin.firestore().doc("users/" + uid).get();
    const data = doc.exists ? (doc.data() || {}) : {};
    const prefs = data.emailPrefs || {};
    // default allow if not set
    return (key in prefs) ? !!prefs[key] : true;
  } catch (e) {
    return true;
  }
}

// basic throttle per (thread, recipient)
async function shouldSendNow(lockId, minutes) {
  const ref = admin.firestore().doc("notifyLocks/" + lockId);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const ts = (snap.data() || {}).ts || 0;
    if (now - ts < minutes * 60 * 1000) return false;
  }
  await ref.set({ ts: now }, { merge: true });
  return true;
}

async function sendEmail(to, subject, html, key) {
  sgMail.setApiKey(key);
  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: BRAND },
    replyTo: FROM_EMAIL,
    subject,
    html,
  });
}

/** ===== TRIGGERS ===== */

// Welcome email on auth user create
exports.sendWelcomeEmail = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .auth.user()
  .onCreate(async (user) => {
    const key = getSendgridKey();
    try {
      const email = user && user.email;
      const displayName = user && user.displayName;
      const uid = user && user.uid;
      if (!email) return;

      const allowed = await isAllowedByPrefs(uid, "welcome");
      if (!allowed) return;

      const subject = "Welcome to " + BRAND + " 🎉";
      const html = wrapHtml(
        subject,
        "<p>Hi " + escapeHtml(displayName || "there") + ",</p>" +
          "<p>Welcome to <strong>" + escapeHtml(BRAND) + "</strong>! Add at least one great photo (we recommend 3+) to make your profile visible.</p>" +
          '<p><a href="' + APP_URL + '/onboarding" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Finish your profile</a></p>'
      );

      await sendEmail(email, subject, html, key);
    } catch (e) {
      console.error("sendWelcomeEmail:", e);
    }
  });

// Email on like creation
exports.notifyOnLike = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("likes/{likeId}")
  .onCreate(async (snap) => {
    const key = getSendgridKey();
    try {
      const data = snap.data() || {};
      const toUid = data.toUid;
      const fromUid = data.fromUid;
      if (!toUid || !fromUid || toUid === fromUid) return;

      const allowed = await isAllowedByPrefs(toUid, "likes");
      if (!allowed) return;

      const [toRes, fromRes] = await Promise.all([
        getUserContact(toUid),
        getUserContact(fromUid),
      ]);
      if (!toRes.email) return;

      const subject = "Someone liked you on " + BRAND + " 💛";
      const html = wrapHtml(
        subject,
        "<p>Hi " + escapeHtml(toRes.name) + ",</p>" +
          "<p><strong>" + escapeHtml(fromRes.name || "Someone") + "</strong> liked you!</p>" +
          '<p><a href="' + APP_URL + '/matches" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">See who</a></p>'
      );

      await sendEmail(toRes.email, subject, html, key);
    } catch (e) {
      console.error("notifyOnLike:", e);
    }
  });

// Email on new chat message (throttled per 10 minutes per recipient/thread)
exports.notifyOnMessage = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("chats/{matchId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const key = getSendgridKey();
    try {
      const matchId = (context && context.params && context.params.matchId) || "";
      const data = snap.data() || {};
      const fromUid = data.senderUid || data.fromUid; // support both field names
      const text = data.text;
      if (!matchId || !fromUid) return;

      const toUid = otherUidFromMatch(matchId, fromUid);
      if (!toUid) return;

      const allowed = await isAllowedByPrefs(toUid, "messages");
      if (!allowed) return;

      const ok = await shouldSendNow("msg_" + matchId + "_" + toUid, 10);
      if (!ok) return;

      const [toRes, fromRes] = await Promise.all([
        getUserContact(toUid),
        getUserContact(fromUid),
      ]);
      if (!toRes.email) return;

      const preview = String(text || "").slice(0, 140);
      const subject = "New message on " + BRAND + " ✨";
      const html = wrapHtml(
        subject,
        "<p>Hi " + escapeHtml(toRes.name) + ",</p>" +
          "<p>You have a new message from <strong>" + escapeHtml(fromRes.name || "a match") + "</strong>:</p>" +
          '<blockquote style="margin:10px 0;padding:10px 12px;background:#fff8e6;border-left:4px solid #ff9e2c;border-radius:6px;">' + escapeHtml(preview) + "</blockquote>" +
          '<p><a href="' + APP_URL + "/chat/" + encodeURIComponent(matchId) + '" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">Open chat</a></p>'
      );

      await sendEmail(toRes.email, subject, html, key);
    } catch (e) {
      console.error("notifyOnMessage:", e);
    }
  });
