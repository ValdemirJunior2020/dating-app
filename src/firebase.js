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
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDUOk9E2SAXZvARgQSFQVeEGoRMWLWDbiI",
  authDomain: "review-45013.firebaseapp.com",
  projectId: "review-45013",
  storageBucket: "review-45013.firebasestorage.app",
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

const app = initializeApp(firebaseConfig);

// Core
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// Email/password helpers
export async function emailSignUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try { await sendEmailVerification(cred.user); } catch {}
  return cred;
}
export async function emailSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Upload an avatar to Storage and update users/{uid}.photoURL
 * Returns the download URL.
 */
export async function uploadAvatar(uid, file) {
  const fileRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  await updateDoc(doc(db, "users", uid), { photoURL: url, updatedAt: Date.now() });
  return url;
}

/** Ensure a minimal user doc exists (can be called after login) */
export async function ensureUserDoc(uid, defaults = {}) {
  await setDoc(doc(db, "users", uid), { uid, createdAt: Date.now(), ...defaults }, { merge: true });
}
