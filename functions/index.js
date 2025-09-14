// functions/index.js
// Cloud Functions entry with SendGrid email notifications (from process.env) and optional Stripe.
// - Local/emulator: .env is loaded via dotenv
// - Production: set env vars in your host (e.g., Netlify for Netlify Functions, or set Secrets/Env for Firebase)
// Required envs you can add now/later:
//   SENDGRID_API_KEY=xxx
// Optional envs:
//   FROM_EMAIL=infojr.83@gmail.com
//   SENDGRID_FROM=infojr.83@gmail.com   (alternative to FROM_EMAIL)
//   APP_PUBLIC_URL=https://yourapp.example.com
//   APP_URL=https://yourapp.example.com (fallback alias)
//   APP_BRAND=Candle Love
//   STRIPE_SECRET_KEY=sk_live_...       (enables Stripe endpoints)

require("dotenv").config();

const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const sg = require("@sendgrid/mail");

// ---------- Firebase Admin ----------
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// ---------- Global options ----------
setGlobalOptions({
  region: "us-central1",
  memory: "256MiB",
  concurrency: 10,
});

// ---------- Brand / URLs / From address ----------
const BRAND = process.env.APP_BRAND || "Candle Love";
const FROM_EMAIL =
  process.env.SENDGRID_FROM || process.env.FROM_EMAIL || "infojr.83@gmail.com";
const APP_PUBLIC_URL =
  process.env.APP_PUBLIC_URL || process.env.APP_URL || "https://yourapp.example.com";

// ---------- SendGrid helpers ----------
function getSendgridKey() {
  const key = process.env.SENDGRID_API_KEY || "";
  if (!key) {
    console.log("[functions] SENDGRID_API_KEY not set; email notifications are disabled.");
  }
  return key;
}

async function sendEmail(to, subject, html) {
  const key = getSendgridKey();
  if (!key) return false; // skip if not configured
  try {
    sg.setApiKey(key);
    await sg.send({ to, from: FROM_EMAIL, subject, html });
    return true;
  } catch (e) {
    console.error("SendGrid error:", e?.response?.body || e?.message || e);
    return false;
  }
}

// ---------- Utility helpers ----------
async function once(key) {
  const ref = db.collection("notif_log").doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return false;
    tx.set(ref, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return true;
  });
}

async function getUserDocWithEmail(uid) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  let email = data?.email || data?.contactEmail || null;
  if (!email) {
    try {
      const u = await auth.getUser(uid);
      email = u.email || null;
    } catch (_) {}
  }
  return { uid, ...data, email };
}

function prefs(user) {
  return {
    email: user?.email || null,
    emailOptIn: user?.emailOptIn !== false, // default true
    notifyOnLike: user?.notifyOnLike !== false,
    notifyOnMatch: user?.notifyOnMatch !== false,
  };
}

function canEmail(user, type) {
  const p = prefs(user);
  if (!p.email || !p.emailOptIn) return false;
  if (type === "like") return p.notifyOnLike;
  if (type === "match") return p.notifyOnMatch;
  return false;
}

// ---------- Email templates ----------
function likeTemplate({ likerName }) {
  const url = `${APP_PUBLIC_URL}/matches`;
  return {
    subject: `Someone liked you on ${BRAND} 💛`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:16px;color:#222">
        <p style="font-size:18px"><strong>${likerName || "Someone"}</strong> liked you on <strong>${BRAND}</strong>.</p>
        <p>Open the app to see who and like them back.</p>
        <p><a href="${url}" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">View likes</a></p>
        <p style="font-size:12px;color:#666">Manage your notifications in Settings.</p>
      </div>`,
  };
}

function matchTemplate({ otherName, otherUid }) {
  const url = `${APP_PUBLIC_URL}/chat/with/${encodeURIComponent(otherUid || "")}`;
  return {
    subject: `It’s a match on ${BRAND}! Start chatting 💬`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:16px;color:#222">
        <p style="font-size:18px">You matched with <strong>${otherName || "someone"}</strong> on <strong>${BRAND}</strong>!</p>
        <p>Say hi and keep the spark going.</p>
        <p><a href="${url}" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">Open chat</a></p>
        <p style="font-size:12px;color:#666">Manage your notifications in Settings.</p>
      </div>`,
  };
}

// ---------- Flexible parsers ----------
function parseLike(docData, params) {
  const toUid =
    docData.toUid || docData.receiverUid || docData.likedUid || docData.to || params?.uid || null;
  const fromUid =
    docData.fromUid || docData.senderUid || docData.likerUid || docData.from || null;
  return { toUid, fromUid };
}

function parseMatch(docData, params) {
  let u1 = docData.u1 || docData.user1 || docData.a || null;
  let u2 = docData.u2 || docData.user2 || docData.b || null;
  if ((!u1 || !u2) && Array.isArray(docData.users) && docData.users.length >= 2) {
    [u1, u2] = docData.users;
  }
  if ((!u1 || !u2) && params?.uid && (docData.otherUid || docData.withUid)) {
    u1 = params.uid;
    u2 = docData.otherUid || docData.withUid;
  }
  return { u1, u2 };
}

// ---------- LIKE triggers ----------
async function handleLikeEvent(event) {
  if (!event?.data) return;
  const data = event.data.data();
  const { toUid, fromUid } = parseLike(data, event.params || {});
  if (!toUid || !fromUid || toUid === fromUid) return;

  const path = event?.data?.ref?.path || `likes/${Date.now()}`;
  if (!(await once(`like:${path}`))) return;

  const [toUser, fromUser] = await Promise.all([
    getUserDocWithEmail(toUid),
    getUserDocWithEmail(fromUid),
  ]);
  if (!canEmail(toUser, "like")) return;

  const likerName = fromUser?.displayName || fromUser?.name || "Someone";
  const { subject, html } = likeTemplate({ likerName });
  await sendEmail(toUser.email, subject, html);
}

exports.likeCreatedTop = onDocumentCreated("likes/{likeId}", handleLikeEvent);
exports.likeCreatedUserSub = onDocumentCreated("users/{uid}/likes/{likeId}", handleLikeEvent);

// ---------- MATCH triggers ----------
async function notifyMatchFor(recipientUid, otherUid) {
  const [recip, other] = await Promise.all([
    getUserDocWithEmail(recipientUid),
    getUserDocWithEmail(otherUid),
  ]);
  if (!canEmail(recip, "match")) return;

  const otherName = other?.displayName || other?.name || "your match";
  const { subject, html } = matchTemplate({ otherName, otherUid });
  await sendEmail(recip.email, subject, html);
}

async function handleMatchEvent(event) {
  if (!event?.data) return;
  const data = event.data.data();
  const { u1, u2 } = parseMatch(data, event.params || {});
  if (!u1 || !u2 || u1 === u2) return;

  const path = event?.data?.ref?.path || `matches/${Date.now()}`;
  if (!(await once(`match:${path}`))) return;

  await Promise.all([notifyMatchFor(u1, u2), notifyMatchFor(u2, u1)]);
}

exports.matchCreatedTop = onDocumentCreated("matches/{matchId}", handleMatchEvent);
exports.matchCreatedUserSub = onDocumentCreated("users/{uid}/matches/{matchId}", handleMatchEvent);

// ---------- Export your other modules ----------
Object.assign(exports, require("./adminSeed"));     // seedInitialAdmin
Object.assign(exports, require("./collegeStatus")); // tagCollegeOnCreate
Object.assign(exports, require("./edu"));           // sendEduOtp, verifyEduOtp

// ---------- Stripe (optional) ----------
try {
  if (process.env.STRIPE_SECRET_KEY) {
    Object.assign(exports, require("./stripe")); // createCheckoutSession, createPortalSession
    console.log("[functions] Stripe endpoints enabled.");
  } else {
    console.log("[functions] Stripe disabled: missing STRIPE_SECRET_KEY.");
  }
} catch (err) {
  console.log("[functions] Stripe not loaded:", err?.message || err);
}
