// src/services/users.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import cleanPhotos from "../utils/cleanPhotos";

/* ----------------------------- Photo helpers ----------------------------- */

function photosFrom(userDoc) {
  const arr = Array.isArray(userDoc?.photos) ? userDoc.photos : [];
  const cleaned = (cleanPhotos ? cleanPhotos(arr) : arr).filter(
    (s) => typeof s === "string" && s.length > 6
  );
  if (cleaned.length > 0) return cleaned;
  return typeof userDoc?.photoURL === "string" && userDoc.photoURL.length > 6
    ? [userDoc.photoURL]
    : [];
}

export function isProfileVisible(userDoc) {
  return photosFrom(userDoc).length > 0;
}

export function needsPhotoEncouragement(userDoc) {
  const n = photosFrom(userDoc).length;
  return n > 0 && n < 3;
}

/* ------------------------------ Profile CRUD ----------------------------- */

export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyProfile(uid) {
  return getUserProfile(uid);
}

/**
 * Update allowed user fields + updatedAt.
 * (Your Firestore rules require updatedAt == request.time and disallow changing createdAt.)
 */
export async function updateMyProfile(uid, updates = {}) {
  if (!uid) throw new Error("Missing uid");

  // Only allow a safe subset that matches your rules
  const payload = {};
  const allow = ["displayName", "bio", "photoURL", "gender", "school", "age", "collegeVerified"];
  for (const k of allow) {
    if (k in updates) payload[k] = updates[k];
  }
  payload.updatedAt = serverTimestamp();

  await setDoc(doc(db, "users", uid), payload, { merge: true });
}

/* --------------------------- Notification prefs -------------------------- */

export async function updateNotificationPrefs(uid, prefs = {}) {
  if (!uid) throw new Error("Missing uid");
  // Merge into users/{uid}.notificationPrefs
  await setDoc(
    doc(db, "users", uid),
    { notificationPrefs: { ...prefs }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* --------------------------- Visible users (dev) -------------------------- */

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

export async function recomputeVisibility(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const got = await getDoc(ref);
  if (!got.exists()) return;
  const data = got.data();
  const visible = isProfileVisible(data);
  await updateDoc(ref, { visible, updatedAt: serverTimestamp() });
}

/* --------------------------- Public gallery (FS) -------------------------- */

/**
 * Create a gallery doc under users/{uid}/public_photos with server timestamps.
 * Firestore rules expect: { owner, url, createdAt: request.time, updatedAt: request.time, caption? }
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
  const c = String(caption || "").trim();
  if (c) payload.caption = c.slice(0, 140);
  await addDoc(ref, payload);
}

/** Live list of my public photos (newest first). Returns unsubscribe() */
export function listenMyPublicPhotos(uid, cb) {
  if (!uid) return () => {};
  const ref = collection(db, "users", uid, "public_photos");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    cb?.(arr);
  });
}

/** Set the user's main photoURL to a gallery URL */
export async function setMainPhoto(uid, url) {
  if (!uid || !url) throw new Error("Missing uid or url");
  await updateDoc(doc(db, "users", uid), {
    photoURL: String(url),
    updatedAt: serverTimestamp(),
  });
}

/** Delete a gallery doc (does not delete Storage file) */
export async function deletePublicPhotoDoc(uid, pid) {
  if (!uid || !pid) throw new Error("Missing uid or photo id");
  await deleteDoc(doc(db, "users", uid, "public_photos", pid));
}

/* ------------------------------ Interests (opt) --------------------------- */
/** If you still use interests here, keep these helpers; otherwise safe to ignore. */
export function tagsFrom(x) {
  if (Array.isArray(x)) return x.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof x === "string") return x.split(",").map((s) => s.trim()).filter(Boolean);
  if (x && typeof x === "object") return Object.keys(x).filter((k) => Boolean(x[k]));
  return [];
}

export async function saveUserInterests(uid, interests = []) {
  const clean = Array.from(new Set(tagsFrom(interests))).slice(0, 25);
  await setDoc(doc(db, "users", uid), { interests: clean, updatedAt: serverTimestamp() }, { merge: true });
  return clean;
}
