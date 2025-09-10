// src/services/users.js
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import cleanPhotos from "../utils/cleanPhotos"; // keep if you have it; we also guard below

/** Return an array of photo URLs from userDoc (photos[] or photoURL) */
function photosFrom(userDoc) {
  const arr = Array.isArray(userDoc?.photos) ? userDoc.photos : [];
  const cleaned = (cleanPhotos ? cleanPhotos(arr) : arr).filter(
    (s) => typeof s === "string" && s.length > 6
  );
  if (cleaned.length > 0) return cleaned;
  // fallback: single photoURL field
  return typeof userDoc?.photoURL === "string" && userDoc.photoURL.length > 6
    ? [userDoc.photoURL]
    : [];
}

/** Visible if they have at least one usable photo (photos[] or photoURL) */
export function isProfileVisible(userDoc) {
  return photosFrom(userDoc).length > 0;
}

/** Nudge if 1–2 photos */
export function needsPhotoEncouragement(userDoc) {
  const n = photosFrom(userDoc).length;
  return n > 0 && n < 3;
}

/** Fetch one user's profile by uid */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Client-side fetch of visible users (demo/dev) */
export async function fetchVisibleUsers() {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  const list = [];
  snap.forEach((d) => {
    const data = d.data();
    if (isProfileVisible(data)) list.push({ id: d.id, ...data });
  });
  return list;
}

/** Optional: persist a boolean 'visible' flag for quick filtering server-side */
export async function recomputeVisibility(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const got = await getDoc(ref);
  if (!got.exists()) return;
  const data = got.data();
  const visible = isProfileVisible(data);
  await updateDoc(ref, { visible });
}

/* ---------- Interests helpers (kept for compatibility with older code) ---------- */

/** Normalize any interests shape to string[] */
export function tagsFrom(x) {
  if (Array.isArray(x)) return x.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof x === "string")
    return x.split(",").map((s) => s.trim()).filter(Boolean);
  if (x && typeof x === "object")
    return Object.keys(x).filter((k) => Boolean(x[k]));
  return [];
}

/** Save interests on users/{uid}.interests as a trimmed, deduped string[] */
export async function saveUserInterests(uid, interests = []) {
  const clean = Array.from(new Set(tagsFrom(interests))).slice(0, 25);
  await setDoc(doc(db, "users", uid), { interests: clean }, { merge: true });
  return clean;
}

/* ---------- Notification + phone helpers (compat with Settings/SignUp) ---------- */

/** Merge notification preferences onto user doc */
export async function updateNotificationPrefs(uid, prefs = {}) {
  if (!uid) throw new Error("Missing uid");
  await setDoc(doc(db, "users", uid), { notificationPrefs: { ...prefs } }, { merge: true });
}

/** Set phone + optional default prefs */
export async function setUserPhoneAndPrefs(uid, phone, prefs = {}) {
  if (!uid) throw new Error("Missing uid");
  const payload = {};
  if (phone) payload.phone = String(phone);
  if (prefs && typeof prefs === "object") payload.notificationPrefs = { ...prefs };
  await setDoc(doc(db, "users", uid), payload, { merge: true });
}
