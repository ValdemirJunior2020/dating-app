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
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// IMPORTANT: storageBucket must be *.appspot.com
const firebaseConfig = {
  apiKey: "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.appspot.com",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

const app = initializeApp(firebaseConfig);

// Core SDKs
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google sign-in
const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// ---------- Email/Password helpers (named exports) ----------
export async function emailSignUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // fire-and-forget verification email
  try { await sendEmailVerification(cred.user); } catch {}
  // ensure a user doc exists
  await ensureUserDoc(cred.user.uid, { email });
  return cred;
}

export async function emailSignIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user.uid, { email });
  return cred;
}

export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// ---------- User profile helpers ----------
/** Create/merge a minimal users/{uid} doc */
export async function ensureUserDoc(uid, defaults = {}) {
  const data = { uid, createdAt: Date.now(), ...defaults };
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

/** Upload avatar to Storage and update users/{uid}.photoURL */
export async function uploadAvatar(uid, file) {
  const fileRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await updateDoc(doc(db, "users", uid), { photoURL: url, updatedAt: Date.now() });
  return url;
}
