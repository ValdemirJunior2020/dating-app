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

// --- Firebase config (uses your key; falls back if env not set) ---
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FB_API_KEY ||
    "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  // ✅ correct Storage bucket for web SDK
  storageBucket: "review-45013.appspot.com",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

// Prevent double init in dev/hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

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
    // ✅ defaults ON so your email functions work automatically
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
  // Should print: "Firebase projectId: review-45013"
  // Open your browser console on Netlify and verify.
  // If it prints something else, update the config above.
  // eslint-disable-next-line no-console
  console.log("Firebase projectId:", app.options.projectId);
}

export default app;
