/* adminSeed.js — one-time seeding endpoint to grant admin to an email.
   Usage (after deploy):
     curl -X POST "https://<region>-<project>.cloudfunctions.net/seedInitialAdmin" \
       -H "Content-Type: application/json" \
       -d '{"token":"<YOUR_SECRET_TOKEN>","email":"infojr.83@gmail.com"}'
*/
const functions = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Secret to protect the endpoint. Set already via:
//   firebase functions:secrets:set ADMIN_SEED_TOKEN
const ADMIN_SEED_TOKEN = defineSecret("ADMIN_SEED_TOKEN");

// Simple CORS
function addCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.seedInitialAdmin = functions
  .runWith({ secrets: [ADMIN_SEED_TOKEN] })
  .https.onRequest(async (req, res) => {
    addCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    try {
      const body = req.body || {};
      const token = String(body.token || "");
      const email = String(body.email || "infojr.83@gmail.com").toLowerCase();

      const secret = ADMIN_SEED_TOKEN.value();
      if (!secret) return res.status(500).json({ ok: false, error: "Missing ADMIN_SEED_TOKEN" });
      if (token !== secret) return res.status(403).json({ ok: false, error: "Bad token" });

      // Find user by email
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (e) {
        return res.status(400).json({ ok: false, error: "User does not exist in Auth. Create it first in Firebase Console > Authentication." });
      }

      // Set custom claim
      const prev = userRecord.customClaims || {};
      await admin.auth().setCustomUserClaims(userRecord.uid, { ...prev, admin: true });

      // Mirror to Firestore for easy querying
      await db.doc(`users/${userRecord.uid}`).set({
        roles: { admin: true },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return res.status(200).json({ ok: true, email, uid: userRecord.uid, admin: true });
    } catch (err) {
      console.error("seedInitialAdmin:", err);
      return res.status(500).json({ ok: false, error: String(err.message || err) });
    }
  });
