// src/services/users.js
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const cache = new Map();

export async function getUserProfile(uid) {
  if (!uid) return null;
  if (cache.has(uid)) return cache.get(uid);
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? { uid, ...snap.data() } : null;
  cache.set(uid, data);
  return data;
}
