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

// CRA NOTE: all values must be REACT_APP_* so Netlify/CRA injects them at build
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,             // e.g. review-45013.firebaseapp.com
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,               // e.g. review-45013
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,       // e.g. review-45013.appspot.com
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,       // optional
};

// --- Initialize Firebase ---
export const app = initializeApp(firebaseConfig);

// --- Services you import around the app ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- App Check ---
// Avoid ESLint issues by using window in the browser only.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Let localhost dev work without real App Check token
  // (remove if you want it enforced in dev)
  // eslint-disable-next-line no-underscore-dangle
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialize App Check only if we actually have a site key set
const siteKey = process.env.REACT_APP_APPCHECK_SITE_KEY;
if (siteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// --- Auth helper functions (your components expect these) ---
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
