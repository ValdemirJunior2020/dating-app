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
  getToken as getAppCheckToken,
} from "firebase/app-check";

/**
 * IMPORTANT:
 * - This project uses the new-style bucket domain: <project-id>.firebasestorage.app
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
const RECAPTCHA_V3_SITE_KEY =
  process.env.REACT_APP_APPCHECK_RECAPTCHA_KEY ||
  "6LeYlL4rAAAAAPd2GYMTKzjJAO_seSawCRs73aaK";

// Debug token (local only)
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const DEBUG_APPCHECK_TOKEN = "2F23D3D2-AF55-4BB5-BEA4-1507535C7E30";
  try {
    window.localStorage.removeItem("firebase:appCheck:debugToken");
  } catch {}
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = DEBUG_APPCHECK_TOKEN;
  console.log("Using App Check debug token:", DEBUG_APPCHECK_TOKEN);
}

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// Non-blocking fetch for a token to warm things up
(async () => {
  try {
    const res = await getAppCheckToken(appCheck, true);
    console.log("App Check token acquired:", Boolean(res?.token));
  } catch (e) {
    console.error("App Check token fetch FAILED:", e?.message || e);
  }
})();

/* ------------------------------ Core services ----------------------------- */
export const auth = getAuth(app);
export const db = getFirestore(app);
// Bind to the configured bucket (new domain is fine)
export const storage = getStorage(app);

export const provider = new GoogleAuthProvider();

/* --------------------------- Convenience auth API ------------------------- */
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
 * Minimal user doc compatible with strict Firestore rules
 * (avoid setting fields that rules don’t allow on create).
 */
export async function ensureUserDoc(user, overrides = {}) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base = {
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
