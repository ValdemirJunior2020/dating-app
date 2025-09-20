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
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";

/**
 * IMPORTANT:
 * - Your bucket uses the new domain: <project-id>.firebasestorage.app
 * - Keep it overrideable via .env:
 *     REACT_APP_FIREBASE_STORAGE_BUCKET=review-45013.firebasestorage.app
 */
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    process.env.REACT_APP_FB_API_KEY ||
    "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "review-45013.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "review-45013",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "review-45013.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "198812507562",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: process.env.REACT_APP_MEASUREMENT_ID || "G-972PGXEDB3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* --------------------------- Firebase App Check --------------------------- */
// In dev we’ll use a DEBUG token; in prod, provide your real v3 site key via env.
const RECAPTCHA_V3_SITE_KEY = process.env.REACT_APP_APPCHECK_RECAPTCHA_KEY || "";

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Let Firebase generate/accept a local debug token automatically
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.info("[AppCheck] DEBUG token enabled for local development.");
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY || "debug"),
  isTokenAutoRefreshEnabled: true,
});
// NOTE: Do NOT call getToken() here; the SDK will fetch on demand.
// This avoids early “AppCheck: reCAPTCHA error” during boot.

/* ------------------------------ Core services ----------------------------- */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // bound to firebaseConfig.storageBucket

/* --------------------------- Convenience auth API ------------------------- */
export const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user);
  return res.user;
}

export async function emailSignUp({ email, password, displayName, about }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  if (displayName) await updateProfile(user, { displayName });
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
 * Minimal user document to satisfy strict Firestore rules.
 * (Extend through Settings/Profile UIs rather than here.)
 */
export async function ensureUserDoc(user, overrides = {}) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || overrides.displayName || "",
    photoURL: user.photoURL || "",
    bio: overrides.about || "",
    school: "",
    gender: "",
    age: "",
    collegeVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, base);
  } else {
    const patch = {
      ...(overrides.displayName ? { displayName: overrides.displayName } : {}),
      updatedAt: serverTimestamp(),
    };
    if (Object.keys(patch).length > 1) {
      await setDoc(ref, patch, { merge: true });
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  console.log("Firebase projectId:", app.options.projectId);
}

export default app;
