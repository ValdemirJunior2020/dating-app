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

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    process.env.REACT_APP_FB_API_KEY ||
    "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "review-45013.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "review-45013",
  // ✅ use the bucket that actually exists in your project
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

// Debug token for local dev only
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const DEBUG_APPCHECK_TOKEN = "2F23D3D2-AF55-4BB5-BEA4-1507535C7E30";
  try {
    window.localStorage.removeItem("firebase:appCheck:debugToken");
  } catch {}
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = DEBUG_APPCHECK_TOKEN;
  console.log("Using App Check debug token:", DEBUG_APPCHECK_TOKEN);
  console.log("App ID:", app?.options?.appId);
}

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// Try to fetch token immediately (non-blocking)
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

// ✅ Bind Storage to the bucket in firebaseConfig.storageBucket
export const storage = getStorage(app);

/* --------------------------- Auth convenience API ------------------------- */
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
 * Creates/merges a minimal user doc compatible with strict Firestore rules.
 * Extend via Settings/Profile screens rather than here to avoid rule conflicts.
 */
export async function ensureUserDoc(user, overrides = {}) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Keep fields minimal to satisfy common rulesets
  const base = {
    displayName: user.displayName || overrides.displayName || "",
    photoURL: user.photoURL || "",
    bio: overrides.about || "", // optional; many rules allow 'bio'
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
    // Only merge whitelisted fields
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
