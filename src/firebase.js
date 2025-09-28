// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ---- Firebase config via env ----
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

// sanity log (remove after verifying in prod)
try {
  console.log("[FB]", app.options.projectId, app.options.authDomain, window.location.origin);
} catch {}

export const auth = getAuth(app);
auth.useDeviceLanguage();
setPersistence(auth, browserLocalPersistence).catch((e) =>
  console.warn("[Auth] setPersistence warning:", e?.message || e)
);

export const db = getFirestore(app);
export const storage = getStorage(app);

// ---- App Check (optional; enable after site is stable) ----
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

// ---- Exported helpers (match your imports across the app) ----
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const emailSignIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const sendReset = (email) => sendPasswordResetEmail(auth, email);

export const logOut = () => signOut(auth);
