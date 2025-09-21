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

/**
 * Hardcoded Firebase web config (public by design).
 * This avoids any env-injection issues causing key=YOUR_KEY in production.
 * You can move back to env vars later if you want, but this is perfectly fine.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.appspot.com",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

// ---- tiny runtime log so you can verify on prod ----
if (typeof window !== "undefined" && !window.__FB_DEBUGGED__) {
  window.__FB_DEBUGGED__ = true;
  // eslint-disable-next-line no-console
  console.log("[APP-OPTIONS]", {
    apiKey: firebaseConfig.apiKey.slice(0, 6) + "…",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId.slice(0, 6) + "…",
  });
}

// Init
export const app = initializeApp(firebaseConfig);

// Services your app imports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Auth helpers (used across your app) ---
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

/**
 * App Check is intentionally disabled here until prod auth works for users.
 * Once sign-up/sign-in are confirmed, re-enable with your site key:
 *
 * import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
 * initializeAppCheck(app, {
 *   provider: new ReCaptchaV3Provider("<YOUR_RECAPTCHA_V3_SITE_KEY>"),
 *   isTokenAutoRefreshEnabled: true,
 * });
 *
 * Also be sure App Check “Enforcement” is ON in console only after this works.
 */
