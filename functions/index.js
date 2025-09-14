// functions/index.js
require("dotenv").config(); // loads .env locally/emulator
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const sg = require("@sendgrid/mail");

setGlobalOptions({ region: "us-central1", memory: "256MiB", concurrency: 10 });

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// --- SendGrid config ---
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@yourdomain.com";
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || "https://yourapp.example.com";
if (SENDGRID_API_KEY) sg.setApiKey(SENDGRID_API_KEY);

// ---------- Helpers ----------
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
    email: user.email || null,
    emailOptIn: user.emailOptIn !== false, // default true
    notifyOnLike: user.notifyOnLike !== false,
    notifyOnMatch: user.notifyOnMatch !== false,
  };
}

function canEmail(user, type) {
  const p = prefs(user);
  if (!SENDGRID_API_KEY || !p.emailOptIn || !p.email) return false;
  if (type === "like") return p.notifyOnLike;
  if (type === "match") return p.notifyOnMatch;
  return false;
}

async function sendEmail(to, subject, html) {
  if (!SENDGRID_API_KEY) return false;
  await sg.send({ to, from: FROM_EMAIL, subject, html });
  return true;
}

function likeTemplate({ likerName }) {
  const url = `${APP_PUBLIC_URL}/matches`;
  return {
    subject: `Someone liked you on Candle Love 💛`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:16px;color:#222">
        <p style="font-size:18px"><strong>${likerName || "Someone"}</strong> liked you on <strong>Candle Love</strong>.</p>
        <p>Open the app to see who and like them back.</p>
        <p><a href="${url}" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">View likes</a></p>
        <p style="font-size:12px;color:#666">Manage your notifications in Settings.</p>
      </div>`,
  };
}

function matchTemplate({ otherName, otherUid }) {
  const url = `${APP_PUBLIC_URL}/chat/with/${encodeURIComponent(otherUid || "")}`;
  return {
    subject: `It’s a match! Start chatting 💬`,
    html: `
      <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:16px;color:#222">
        <p style="font-size:18px">You matched with <strong>${otherName || "someone"}</strong> on <strong>Candle Love</strong>!</p>
        <p>Say hi and keep the spark going.</p>
        <p><a href="${url}" style="background:#ff9e2c;color:#1a0f07;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:700">Open chat</a></p>
        <p style="font-size:12px;color:#666">Manage your notifications in Settings.</p>
      </div>`,
  };
}

// Extract uids from common like schemas
function parseLike(docData, params) {
  const toUid =
    docData.toUid || docData.receiverUid || docData.likedUid || docData.to || params?.uid || null;
  const fromUid =
    docData.fromUid || docData.senderUid || docData.likerUid || docData.from || null;
  return { toUid, fromUid };
}

// Extract from common match schemas
function parseMatch(docData, params) {
  let u1 = docData.u1 || docData.user1 || docData.a || null;
  let u2 = docData.u2 || docData.user2 || docData.b || null;
  if ((!u1 || !u2) && Array.isArray(docData.users) && docData.users.length >= 2) {
    u1 = docData.users[0];
    u2 = docData.users[1];
  }
  if ((!u1 || !u2) && params?.uid && (docData.otherUid || docData.withUid)) {
    u1 = params.uid;
    u2 = docData.otherUid || docData.withUid;
  }
  return { u1, u2 };
}

// ---------- LIKE triggers ----------
async function handleLikeEvent(event, sourceKey) {
  if (!event?.data) return;
  const doc = event.data.data();
  const { toUid, fromUid } = parseLike(doc, event.params || {});
  if (!toUid || !fromUid || toUid === fromUid) return;

  const path = event.data.ref?.path || `${sourceKey}/${Date.now()}`;
  const dedupeKey = `like:${path}`;
  if (!(await once(dedupeKey))) return;

  const [toUser, fromUser] = await Promise.all([
    getUserDocWithEmail(toUid),
    getUserDocWithEmail(fromUid),
  ]);

  const likerName = fromUser?.displayName || fromUser?.name || "Someone";

  if (canEmail(toUser, "like")) {
    const { subject, html } = likeTemplate({ likerName });
    await sendEmail(toUser.email, subject, html).catch(() => {});
  }
}

exports.likeCreatedTop = onDocumentCreated("likes/{likeId}", async (event) =>
  handleLikeEvent(event, "likes")
);

exports.likeCreatedUserSub = onDocumentCreated("users/{uid}/likes/{likeId}", async (event) =>
  handleLikeEvent(event, "usersLikes")
);

// ---------- MATCH triggers ----------
async function notifyMatchFor(recipientUid, otherUid) {
  const [recip, other] = await Promise.all([
    getUserDocWithEmail(recipientUid),
    getUserDocWithEmail(otherUid),
  ]);
  const otherName = other?.displayName || other?.name || "your match";

  if (canEmail(recip, "match")) {
    const { subject, html } = matchTemplate({ otherName, otherUid });
    await sendEmail(recip.email, subject, html).catch(() => {});
  }
}

async function handleMatchEvent(event, sourceKey) {
  if (!event?.data) return;
  const doc = event.data.data();
  const { u1, u2 } = parseMatch(doc, event.params || {});
  if (!u1 || !u2 || u1 === u2) return;

  const path = event.data.ref?.path || `${sourceKey}/${Date.now()}`;
  const dedupeKey = `match:${path}`;
  if (!(await once(dedupeKey))) return;

  await Promise.all([notifyMatchFor(u1, u2), notifyMatchFor(u2, u1)]);
}

exports.matchCreatedTop = onDocumentCreated("matches/{matchId}", async (event) =>
  handleMatchEvent(event, "matches")
);

exports.matchCreatedUserSub = onDocumentCreated("users/{uid}/matches/{matchId}", async (event) =>
  handleMatchEvent(event, "usersMatches")
);

// ---------- bring in all other modules ----------
Object.assign(exports, require("./adminSeed"));     // seedInitialAdmin
Object.assign(exports, require("./collegeStatus")); // tagCollegeOnCreate
Object.assign(exports, require("./edu"));           // sendEduOtp, verifyEduOtp
Object.assign(exports, require("./stripe"));        // createCheckoutSession, createPortalSession
