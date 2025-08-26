/* eslint-disable linebreak-style, max-len, require-jsdoc, object-curly-spacing, comma-dangle, indent, no-empty */
/**
 * Candle Love — transactional emails via SendGrid
 * Triggers:
 *  - Welcome on Auth user creation
 *  - Like on Firestore: likes/{likeId}
 *  - Message on Firestore: chats/{matchId}/messages/{messageId}
 *
 * Sender: infojr.83@gmail.com (verify in SendGrid → Single Sender)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

/** ===== App config ===== */
const BRAND = "Candle Love";
const FROM_EMAIL = "infojr.83@gmail.com";        // must be verified in SendGrid
const APP_URL = "http://localhost:3000";         // change to your live URL later

/** ===== API key sources (priority order) =====
 * 1) Firebase Secret SENDGRID_API_KEY
 * 2) Environment variable SENDGRID_API_KEY
 * 3) Inline fallback (last resort; you provided this)
 */
const SENDGRID_SECRET = defineSecret("SENDGRID_API_KEY");
const INLINE_SENDGRID_API_KEY = "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";

function getSendgridKey() {
  return (
    SENDGRID_SECRET.value() ||
    process.env.SENDGRID_API_KEY ||
    INLINE_SENDGRID_API_KEY
  );
}

/** ===== Utils ===== */
function escapeHtml(s) {
  s = s == null ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapHtml(title, bodyHtml) {
  return (
    "<!doctype html><html><head>" +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>" + escapeHtml(title) + "</title>" +
    "</head>" +
    '<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f2;padding:24px 0;">' +
    "<tr><td align=\"center\">" +
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e6da;">' +
    "<tr>" +
    '<td style="background:#522703;color:#fff8e6;padding:18px 24px;font-size:18px;font-weight:700;">' +
    escapeHtml(BRAND) +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td style="padding:24px;font-size:16px;line-height:1.5;color:#1f1b16;">' +
    bodyHtml +
    '<p style="margin-top:28px;font-size:13px;color:#6b635a;">' +
    "You received this because you have a " + escapeHtml(BRAND) + " account." +
    "</p>" +
    "</td>" +
    "</tr>" +
    "<tr>" +
    '<td style="background:#fff2e3;color:#4a3a2f;padding:14px 24px;font-size:12px;">' +
    "© " + new Date().getFullYear() + " " + escapeHtml(BRAND) + " • " +
    '<a href="' + APP_URL + '" style="color:#b8742c;text-decoration:none;">Open ' + escapeHtml(BRAND) + "</a>" +
    "</td>" +
    "</tr>" +
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
  return { email: email, name: name };
}

async function isAllowedByPrefs(uid, key) {
  try {
    const doc = await admin.firestore().doc("users/" + uid).get();
    const data = doc.exists ? (doc.data() || {}) : {};
    const prefs = data.emailPrefs || {};
    return (key in prefs) ? !!prefs[key] : true;
  } catch (e) {
    return true;
  }
}

// simple throttle per (thread, recipient)
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
    to: to,
    from: { email: FROM_EMAIL, name: BRAND },
    replyTo: FROM_EMAIL,
    subject: subject,
    html: html
  });
}

/** ===== Triggers ===== */

// Welcome email
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
          '<p><a href="' + APP_URL + '/onboarding" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Finish your profile</a></p>'
      );

      await sendEmail(email, subject, html, key);
    } catch (e) {
      console.error("sendWelcomeEmail:", e);
    }
  });

// Like notification
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

      const toP = getUserContact(toUid);
      const fromP = getUserContact(fromUid);
      const toRes = await toP;
      const fromRes = await fromP;

      if (!toRes.email) return;

      const subject = "Someone liked you on " + BRAND + " 💛";
      const html = wrapHtml(
        subject,
        "<p>Hi " + escapeHtml(toRes.name) + ",</p>" +
          "<p><strong>" + escapeHtml(fromRes.name || "Someone") + "</strong> liked you!</p>" +
          '<p><a href="' + APP_URL + '/matches" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">See who</a></p>'
      );

      await sendEmail(toRes.email, subject, html, key);
    } catch (e) {
      console.error("notifyOnLike:", e);
    }
  });

// Message notification (throttled)
exports.notifyOnMessage = functions
  .runWith({ secrets: [SENDGRID_SECRET] })
  .firestore.document("chats/{matchId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const key = getSendgridKey();
    try {
      const matchId = (context && context.params && context.params.matchId) || "";
      const data = snap.data() || {};
      const fromUid = data.fromUid;
      const text = data.text;
      if (!matchId || !fromUid) return;

      const toUid = otherUidFromMatch(matchId, fromUid);
      if (!toUid) return;

      const allowed = await isAllowedByPrefs(toUid, "messages");
      if (!allowed) return;

      const ok = await shouldSendNow("msg_" + matchId + "_" + toUid, 10);
      if (!ok) return;

      const toP = getUserContact(toUid);
      const fromP = getUserContact(fromUid);
      const toRes = await toP;
      const fromRes = await fromP;

      if (!toRes.email) return;

      const preview = String(text || "").slice(0, 140);
      const subject = "New message on " + BRAND + " ✨";
      const html = wrapHtml(
        subject,
        "<p>Hi " + escapeHtml(toRes.name) + ",</p>" +
          "<p>You have a new message from <strong>" + escapeHtml(fromRes.name || "a match") + "</strong>:</p>" +
          '<blockquote style="margin:10px 0;padding:10px 12px;background:#fff8e6;border-left:4px solid #ff9e2c;border-radius:6px;">' + escapeHtml(preview) + "</blockquote>" +
          '<p><a href="' + APP_URL + "/chat/" + encodeURIComponent(matchId) + '" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700;">Open chat</a></p>'
      );

      await sendEmail(toRes.email, subject, html, key);
    } catch (e) {
      console.error("notifyOnMessage:", e);
    }
  });
