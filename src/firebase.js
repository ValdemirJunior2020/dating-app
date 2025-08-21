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
  arrayUnion,
} from "firebase/firestore";
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
  storageBucket: "review-45013.appspot.com", // make sure it's *.appspot.com
  messagingSenderId: "198812507562",
  appId: "1:198812507562:web:fb9352cc9aafd3361a5fd3",
  measurementId: "G-972PGXEDB3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// Email/password helpers
export async function emailSignUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try { await sendEmailVerification(cred.user); } catch {}
  await ensureUserDoc(cred.user.uid, { email });
  return cred;
}
export async function emailSignIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user.uid, { email });
  return cred;
}
export const sendReset = (email) => sendPasswordResetEmail(auth, email);

// Ensure user doc
export async function ensureUserDoc(uid, defaults = {}) {
  await setDoc(
    doc(db, "users", uid),
    { uid, createdAt: Date.now(), ...defaults },
    { merge: true }
  );
}

// ---------- PHOTOS ----------
/** Upload a single photo to Storage and return its download URL */
export async function uploadPhoto(uid, file) {
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `photos/${uid}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

/** Upload many files, append to users/{uid}.photos (array of URLs), return new URLs */
export async function uploadPhotos(uid, files) {
  const urls = [];
  for (const f of files) {
    const url = await uploadPhoto(uid, f);
    urls.push(url);
    await updateDoc(doc(db, "users", uid), { photos: arrayUnion(url), updatedAt: Date.now() });
  }
  return urls;
}
