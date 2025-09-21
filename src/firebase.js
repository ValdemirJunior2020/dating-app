// src/firebase.js

// --- Core ---
import { initializeApp } from "firebase/app";

// --- Auth ---
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

// --- Firestore ---
import { getFirestore } from "firebase/firestore";

// --- Storage ---
import { getStorage } from "firebase/storage";

// --- App Check (reCAPTCHA v3) ---
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

/**
 * CRA uses REACT_APP_* vars at build time.
 * Make sure these exist in:
 *   - .env.local  (local dev)  and
 *   - Netlify env vars (then Clear cache & deploy)
 */
const CFG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // e.g. review-45013.firebasestorage.app
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  appCheckSiteKey: process.env.REACT_APP_APPCHECK_SITE_KEY, // optional
};

// Helpful validation: fail early if the critical ones are missing
(function assertConfig() {
  const missing = [];
  if (!CFG.apiKey) missing.push("REACT_APP_FIREBASE_API_KEY");
  if (!CFG.authDomain) missing.push("REACT_APP_FIREBASE_AUTH_DOMAIN");
  if (!CFG.projectId) missing.push("REACT_APP_FIREBASE_PROJECT_ID");
  if (!CFG.storageBucket) missing.push("REACT_APP_FIREBASE_STORAGE_BUCKET");
  if (!CFG.appId) missing.push("REACT_APP_FIREBASE_APP_ID");

  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Missing required Firebase env vars:\n" +
        missing.map((k) => `  - ${k}`).join("\n") +
        "\n\nCreate .env.local in project root with lines like:\n" +
        "REACT_APP_FIREBASE_API_KEY=AIza...\n" +
        "REACT_APP_FIREBASE_AUTH_DOMAIN=review-45013.firebaseapp.com\n" +
        "REACT_APP_FIREBASE_PROJECT_ID=review-45013\n" +
        "REACT_APP_FIREBASE_STORAGE_BUCKET=review-45013.firebasestorage.app\n" +
        "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...\n" +
        "REACT_APP_FIREBASE_APP_ID=1:...:web:...\n" +
        "(then stop and restart npm start)"
    );
  }
})();

// Initialize Firebase
export const app = initializeApp({
  apiKey: CFG.apiKey,
  authDomain: CFG.authDomain,
  projectId: CFG.projectId,
  storageBucket: CFG.storageBucket,
  messagingSenderId: CFG.messagingSenderId,
  appId: CFG.appId,
  measurementId: CFG.measurementId,
});

// Debug what the app is actually using
if (typeof window !== "undefined") {
  const mask = (s) => (s ? String(s).slice(0, 6) + "…" : s);
  // eslint-disable-next-line no-console
  console.log("[APP-OPTIONS]", {
    apiKey: mask(app.options.apiKey),
    authDomain: app.options.authDomain,
    projectId: app.options.projectId,
    storageBucket: app.options.storageBucket,
    appId: mask(app.options.appId),
  });
  if (!app.options.apiKey) {
    console.error("❌ apiKey is empty in runtime. CRA didn’t inject your env vars.");
  }
  if (String(app.options.storageBucket).endsWith(".appspot.com")) {
    console.warn(
      "⚠️ storageBucket looks like appspot.com — for your project it should be review-45013.firebasestorage.app"
    );
  }
}

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// App Check
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Allow local dev without a site key
  // eslint-disable-next-line no-underscore-dangle
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (CFG.appCheckSiteKey && typeof window !== "undefined") {
  // Only init if a real site key exists
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(CFG.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("App Check init skipped:", e?.message || e);
  }
}

// Auth helpers
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function emailSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  return signOut(auth);
}
