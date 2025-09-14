// functions/collegeStatus.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * On auth user creation:
 * - If their email exists in verifiedEduEmails/{email}, mark profile
 *   users/{uid}.verification.college = true and store domain.
 * - Also set custom claims so your client can gate routes if you want.
 */
exports.tagCollegeOnCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const email = (user && user.email || "").toLowerCase();
    if (!email) return;

    const doc = await db.collection("verifiedEduEmails").doc(email).get();
    if (!doc.exists) {
      // Not verified via OTP (yet).
      return;
    }

    const domain = email.split("@")[1] || "";
    // 1) profile flag (visible to others)
    await db.doc(`users/${user.uid}`).set({
      verification: {
        college: true,
        collegeDomain: domain,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true });

    // 2) custom claims (good for gating features)
    await admin.auth().setCustomUserClaims(user.uid, {
      eduVerified: true,
      userType: "college",
      eduDomain: domain,
    });
  } catch (e) {
    console.error("tagCollegeOnCreate error:", e);
  }
});
