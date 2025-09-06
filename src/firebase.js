// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FB_API_KEY || "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  // ⬇️ use your actual default bucket (what you see in Firebase Console)
  storageBucket: "review-45013.firebasestorage.app",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const RECAPTCHA_V3_SITE_KEY =
  process.env.REACT_APP_APPCHECK_RECAPTCHA_KEY ||
  "6LeYlL4rAAAAAKFe7yFiZYlYqEEO6g3OBQxhV_OR";

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const DEBUG_APPCHECK_TOKEN = "2F23D3D2-AF55-4BB5-BEA4-1507535C7E30";
  try { window.localStorage.removeItem("firebase:appCheck:debugToken"); } catch {}
  // eslint-disable-next-line no-restricted-globals
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = DEBUG_APPCHECK_TOKEN;
  // eslint-disable-next-line no-console
  console.log("Using App Check debug token:", DEBUG_APPCHECK_TOKEN);
  // eslint-disable-next-line no-console
  console.log("App ID:", app?.options?.appId);
}

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

(async () => {
  try {
    const res = await getAppCheckToken(appCheck, true);
    // eslint-disable-next-line no-console
    console.log("App Check token acquired:", Boolean(res?.token));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("App Check token fetch FAILED:", e?.message || e);
  }
})();

export const auth = getAuth(app);
export const db = getFirestore(app);

// ⬇️ explicitly bind Storage to the SAME bucket
export const storage = getStorage(app, "gs://review-45013.firebasestorage.app");

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
export function sendReset(email) { return sendPasswordResetEmail(auth, email); }
export function logOut() { return signOut(auth); }

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
    emailPrefs: { welcome: true, likes: true, messages: true },
  };
  if (!snap.exists()) {
    await setDoc(ref, base);
  } else if (Object.keys(overrides).length) {
    await setDoc(ref, { ...overrides, updatedAt: serverTimestamp() }, { merge: true });
  }
}

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("Firebase projectId:", app.options.projectId);
}

export default app;
