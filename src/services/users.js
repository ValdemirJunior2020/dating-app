// src/services/users.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

/**
 * Shape we expect on /users/{uid}
 * We keep this small; expand as needed.
 */
export const emptyUser = (uid) => ({
  uid,
  displayName: "",
  bio: "",
  interests: [],
  photos: [],
  // helps with ordering and index-friendly queries
  updatedAt: serverTimestamp(),
});

/** Ensure the doc exists with a sane baseline (idempotent). */
export async function ensureUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, emptyUser(uid));
  }
  return ref;
}

/** Load current user profile (returns {exists, data} minimal wrapper). */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return { exists: snap.exists(), data: snap.exists() ? snap.data() : null };
}

/** Patch fields and bump updatedAt. (No merge-deep—pass full arrays). */
export async function updateUserProfile(uid, patch) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Helper: wait for signed-in UID once. */
export function getCurrentUid() {
  return new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (u) => {
      off();
      resolve(u?.uid || null);
    });
  });
}
