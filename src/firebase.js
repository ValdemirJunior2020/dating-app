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

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // <<< must be review-45013.firebasestorage.app
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Init
export const app = initializeApp(firebaseConfig);

// Verify what the app actually sees
if (typeof window !== "undefined") {
  const mask = (s) => (s ? String(s).slice(0, 6) + "…" : s);
  // eslint-disable-next-line no-console
  console.log("[APP-OPTIONS]", {
    apiKey: mask(app.options.apiKey),
    authDomain: app.options.authDomain,
    projectId: app.options.projectId,
    storageBucket: app.options.storageBucket, // <= should be review-45013.firebasestorage.app
    appId: mask(app.options.appId),
  });
  if (app.options.storageBucket?.endsWith(".appspot.com")) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Wrong bucket in use. Set REACT_APP_FIREBASE_STORAGE_BUCKET=review-45013.firebasestorage.app and restart the dev server."
    );
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// App Check (optional; keep enforcement OFF on Storage while stabilizing)
const siteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
if (siteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Helpers you import elsewhere
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
