// src/services/interests.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Get a user's interests array ([]) */
export async function getUserInterests(uid) {
  if (!uid) return [];
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data() || {};
  return Array.isArray(data.interests)
    ? data.interests.filter((x) => typeof x === "string")
    : [];
}

/** Set/merge a user's interests array (deduped, trimmed, max 25) */
export async function setUserInterests(uid, interests = []) {
  if (!uid) throw new Error("Missing uid");
  const clean = Array.from(
    new Set(
      (interests || [])
        .map((s) => String(s).trim())
        .filter(Boolean)
    )
  ).slice(0, 25);

  const ref = doc(db, "users", uid);
  await setDoc(ref, { interests: clean }, { merge: true });
  return clean;
}
