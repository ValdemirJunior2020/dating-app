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
 * CRA NOTE:
 * All values must be provided via REACT_APP_* env vars
 * (Netlify: Site settings → Environment variables; then Clear cache & deploy)
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,             // e.g. review-45013.firebaseapp.com
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,               // e.g. review-45013
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,       // e.g. review-45013.appspot.com
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,       // optional
};

// -------- TEMP DIAGNOSTICS (safe to keep or remove later) --------
(function debugFirebaseConfig() {
  const mask = (v) => (typeof v === "string" ? v.slice(0, 6) + "•••" : v);
  if (typeof window !== "undefined" && !window.__FB_DEBUGGED__) {
    window.__FB_DEBUGGED__ = true;
    // Shows whether Netlify injected envs into the bundle
    // eslint-disable-next-line no-console
    console.log("[FB-CONFIG]", {
      apiKey: mask(process.env.REACT_APP_FIREBASE_API_KEY),
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      appId: mask(process.env.REACT_APP_FIREBASE_APP_ID),
      appCheckSiteKey: mask(process.env.REACT_APP_APPCHECK_SITE_KEY),
      NODE_ENV: process.env.NODE_ENV,
    });
  }
})();

// ================== Initialize Firebase ==================
export const app = initializeApp(firebaseConfig);

// Log what the initialized app actually sees (proves no YOUR_KEY/YOUR_PROJECT)
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[APP-OPTIONS]", {
    apiKey: (app.options.apiKey || "").slice(0, 6) + "…",
    authDomain: app.options.authDomain,
    projectId: app.options.projectId,
    appId: (app.options.appId || "").slice(0, 6) + "…",
  });
}

// =============== Services your app imports ===============
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ======================= App Check =======================
// In dev, allow a debug token so localhost isn’t blocked.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // eslint-disable-next-line no-underscore-dangle
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Only initialize App Check if we have a real site key set
const siteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[APPCHECK-SITEKEY]", (siteKey || "").slice(0, 6) + "…");
}

if (siteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
// If you’re still wiring up in production, you can set App Check
// ENFORCEMENT = Off in Firebase Console temporarily.

// ===================== Auth helpers ======================
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
