// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⭐ App Check (reCAPTCHA v3)
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// --- Firebase config ---
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FB_API_KEY ||
    "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.appspot.com",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

// Prevent double init in dev/hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ⭐ App Check init (reCAPTCHA v3)
// Use env if present, otherwise fall back to your provided site key.
const RECAPTCHA_V3_SITE_KEY =
  process.env.REACT_APP_APPCHECK_RECAPTCHA_KEY ||
  "6LeYlL4rAAAAAKFe7yFiZYlYqEEO6g3OBQxhV_OR";

// Enable debug token on localhost so uploads work with enforcement ON.
// Copy the token printed in the browser console into
// Firebase Console → App Check → Debug tokens.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  // eslint-disable-next-line no-restricted-globals
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// SDK singletons
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Google Sign-in ---
export const provider = new GoogleAuthProvider();
export async function signInWithGoogle() {
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user);
  return res.user;
}

// --- Email/Password helpers ---
export async function emailSignUp({ email, password, displayName, about }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  if (displayName) {
    await updateProfile(user, { displayName });
  }
  await ensureUserDoc(user, { displayName, about });
  return user;
}

export async function emailSignIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

export function logOut() {
  return signOut(auth);
}

/**
 * Ensure users/{uid} exists with sane defaults.
 * Merges provided overrides. Also seeds emailPrefs so
 * Cloud Functions can send notifications immediately.
 */
export async function ensureUserDoc(user, overrides = {}) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || overrides.displayName || "",
    about: overrides.about || "",
    photos: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // defaults ON so your email functions work automatically
    emailPrefs: { welcome: true, likes: true, messages: true },
  };

  if (!snap.exists()) {
    await setDoc(ref, base);
  } else if (Object.keys(overrides).length) {
    await setDoc(
      ref,
      { ...overrides, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

// Debug: confirm the app is using the right project
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("Firebase projectId:", app.options.projectId);
}

export default app;
