// src/services/users.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,                 // ← added
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import cleanPhotos from "../utils/cleanPhotos"; // keep if you have it; safely guarded below

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

/* ---------- Profile editing + gallery helpers ---------- */

/** Alias to read my profile (same as getUserProfile) */
export async function getMyProfile(uid) {
  return getUserProfile(uid);
}

/**
 * Update allowed fields on users/{uid}.
 * Matches your Firestore rules:
 * - Only specific keys
 * - updatedAt must equal request.time (we use serverTimestamp())
 * - Do NOT touch createdAt here
 */
export async function updateMyProfile(uid, partial) {
  if (!uid) throw new Error("Missing uid");

  const allowed = [
    "displayName",
    "bio",
    "photoURL",
    "gender",
    "school",
    "age",
    "collegeVerified", // typically admin-controlled; included for completeness
  ];

  const clean = {};
  for (const k of allowed) {
    if (k in partial && partial[k] !== undefined) clean[k] = partial[k];
  }
  clean.updatedAt = serverTimestamp();

  await updateDoc(doc(db, "users", uid), clean);
}

/** Listen to my public photos subcollection (newest first) */
export function listenMyPublicPhotos(uid, cb) {
  if (!uid) return () => {};
  const q = query(collection(db, "users", uid, "public_photos"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    cb(list);
  });
}

/**
 * Add a public photo document.
 * Rules expect: { owner, url, createdAt, updatedAt, caption? }
 * caption is optional and max 140 chars.
 */
export async function addPublicPhoto(uid, url, caption = "") {
  if (!uid || !url) throw new Error("Missing uid or url");
  const ref = collection(db, "users", uid, "public_photos");
  const payload = {
    owner: uid,
    url: String(url),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const cleanCaption = String(caption || "").trim();
  if (cleanCaption) payload.caption = cleanCaption.slice(0, 140);
  await addDoc(ref, payload);
}

/** Set main profile photo (updates users/{uid}.photoURL + updatedAt) */
export async function setMainPhoto(uid, url) {
  if (!uid || !url) throw new Error("Missing uid or url");
  await updateMyProfile(uid, { photoURL: String(url) });
}

/** Remove photo doc from gallery (does not delete Storage file) */
export async function deletePublicPhotoDoc(uid, pid) {
  if (!uid || !pid) throw new Error("Missing uid or photo id");
  await deleteDoc(doc(db, "users", uid, "public_photos", pid));
}
