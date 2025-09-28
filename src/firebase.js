// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ---- Firebase config from Netlify env (CRA exposes only REACT_APP_*) ----
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, // e.g. review-45013.firebaseapp.com
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // optional
};

export const app = initializeApp(firebaseConfig);

// Sanity log in prod: confirm envs resolved and domain matches expectations
// You can remove this after verifying in the browser console.
try {
  // eslint-disable-next-line no-console
  console.log("[FB]", app.options.projectId, app.options.authDomain, window.location.origin);
} catch {}

// Auth
export const auth = getAuth(app);
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("[Auth] setPersistence warning:", e?.message || e)
);

// Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// ---- Optional: App Check (reCAPTCHA v3) ----
// Netlify envs expected if you enable this:
//   REACT_APP_ENABLE_APPCHECK=true
//   REACT_APP_RECAPTCHA_SITE_KEY=<App Check reCAPTCHA v3 **site** key>
// Keep it false until your deployment is stable to avoid 400 throttle loops.
const enableAppCheck =
  String(process.env.REACT_APP_ENABLE_APPCHECK || "").toLowerCase() === "true";
const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

if (enableAppCheck && recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("[AppCheck] init failed:", e?.message || e);
  }
}

// ---- Google provider helper exported here if you use popup sign-in elsewhere ----
export { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
