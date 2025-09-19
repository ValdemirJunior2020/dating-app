// src/services/users.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import cleanPhotos from "../utils/cleanPhotos"; // optional guard below

/* ----------------------------- Photo utilities ---------------------------- */
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

/* ------------------------------ Profile fetch ----------------------------- */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Alias kept for convenience in places where we call “my” profile:
export const getMyProfile = getUserProfile;

/** Client-side fetch of visible users (dev/demo) */
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

/** Persist a boolean 'visible' flag (optional helper) */
export async function recomputeVisibility(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  const got = await getDoc(ref);
  if (!got.exists()) return;
  const data = got.data();
  const visible = isProfileVisible(data);
  await updateDoc(ref, { visible });
}

/* ----------------------- Profile update (safe merge) ---------------------- */
export async function updateMyProfile(uid, patch = {}) {
  if (!uid) throw new Error("Missing uid");
  // Don’t touch createdAt here; rules often require it to remain unchanged
  const safe = { ...patch, updatedAt: serverTimestamp() };
  await setDoc(doc(db, "users", uid), safe, { merge: true });
}

/* ------------------------ Notification preferences ------------------------ */
export async function updateNotificationPrefs(uid, prefs = {}) {
  if (!uid) throw new Error("Missing uid");
  await setDoc(
    doc(db, "users", uid),
    { notificationPrefs: { ...prefs }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ------------- Interests helpers (compat with older components) ----------- */
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

export async function setUserPhoneAndPrefs(uid, phone, prefs = {}) {
  if (!uid) throw new Error("Missing uid");
  const payload = {};
  if (phone) payload.phone = String(phone);
  if (prefs && typeof prefs === "object") payload.notificationPrefs = { ...prefs };
  payload.updatedAt = serverTimestamp();
  await setDoc(doc(db, "users", uid), payload, { merge: true });
}

/* --------------------------- Public gallery APIs -------------------------- */
/**
 * Firestore rules for users/{uid}/public_photos/{pid} require:
 * { owner, url, createdAt==request.time, updatedAt==request.time, caption? }
 */
export function listenMyPublicPhotos(uid, cb) {
  if (!uid) return () => {};
  const colRef = collection(db, "users", uid, "public_photos");
  return onSnapshot(colRef, (qs) => {
    const rows = [];
    qs.forEach((d) => rows.push({ id: d.id, ...d.data() }));
    cb(rows);
  });
}

export async function addPublicPhoto(uid, url, caption = "") {
  if (!uid || !url) throw new Error("Missing uid or url");
  const colRef = collection(db, "users", uid, "public_photos");
  await addDoc(colRef, {
    owner: uid,
    url: String(url),
    caption: caption ? String(caption).slice(0, 140) : "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setMainPhoto(uid, url) {
  if (!uid || !url) throw new Error("Missing uid or url");
  await updateDoc(doc(db, "users", uid), {
    photoURL: String(url),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePublicPhotoDoc(uid, pid) {
  if (!uid || !pid) throw new Error("Missing uid or pid");
  await deleteDoc(doc(db, "users", uid, "public_photos", pid));
}
