// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- YOUR CONFIG (keep as-is / from env) ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FB_API_KEY || "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.firebasestorage.app",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Google Sign-in ---
const provider = new GoogleAuthProvider();
export async function signInWithGoogle() {
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user);
  return res.user;
}

// --- Email/Password helpers ---
export async function emailSignUp({ email, password, displayName, about }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Set Auth profile displayName
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

/** Ensures users/{uid} exists with defaults; can merge sanitized fields. */
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
  };

  if (!snap.exists()) {
    await setDoc(ref, base);
  } else if (Object.keys(overrides).length) {
    await setDoc(ref, { ...overrides, updatedAt: serverTimestamp() }, { merge: true });
  }
}

export { provider };
