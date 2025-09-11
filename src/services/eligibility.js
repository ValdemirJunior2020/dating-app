// src/services/eligibility.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Safe boolean check on user object */
export function isCollegeVerified(userLike) {
  return !!(userLike && userLike.collegeVerified);
}

/** Load a user's verification flag from Firestore */
export async function fetchCollegeVerified(uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() && !!snap.data().collegeVerified;
}

/** Check both users are verified (parallel fetch) */
export async function bothCollegeVerified(uidA, uidB) {
  if (!uidA || !uidB) return false;
  const [a, b] = await Promise.all([
    fetchCollegeVerified(uidA),
    fetchCollegeVerified(uidB),
  ]);
  return a && b;
}
